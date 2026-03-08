import {
  CONTENT_VERSION,
  CONFLICT_MODULE_VERSION,
  EXPORT_VERSION,
  METHODOLOGY_VERSION,
  PRODUCT_VERSION,
} from "@/content/tests/version";
import { TEST_BLOCKS, createInitialResponses } from "@/content/tests";
import { scoreBigFive } from "@/lib/scoring/big-five";
import { scoreConflictProfile } from "@/lib/scoring/conflict-profile";
import { scoreIpipIpc } from "@/lib/scoring/ipip-ipc";
import { createTextualInterpretation } from "@/lib/scoring/textual";
import type { BlockId, LikertValue, QuestionResponse } from "@/types/assessment";
import type {
  AssessmentProgress,
  FullProfileExport,
  ProfileMeta,
  StoredProfile,
} from "@/types/profile";

export interface CreateProfileInput {
  id: string;
  displayName: string;
  about: string;
  contexts: ProfileMeta["contexts"];
}

export function createEmptyProfile(input: CreateProfileInput): StoredProfile {
  const now = new Date().toISOString();
  const rawAnswers = Object.fromEntries(
    TEST_BLOCKS.map((block) => [block.id, createInitialResponses(block)]),
  ) as FullProfileExport["rawAnswers"];

  const profile: StoredProfile = {
    exportType: "self-understanding-profile-v1",
    profileMeta: {
      id: input.id,
      displayName: input.displayName,
      about: input.about,
      contexts: input.contexts,
      language: "ru",
      createdAt: now,
      updatedAt: now,
      privacyMode: "local-first",
      status: "draft",
    },
    assessmentProgress: buildAssessmentProgress(rawAnswers),
    rawAnswers,
    scoring: {
      "big-five": [],
      "ipip-ipc": [],
      "conflict-profile": [],
    },
    derivedScores: [],
    textualInterpretation: {
      shortProfile: "Профиль создан. Для интерпретации нужно заполнить тестовые блоки.",
      detailedProfile:
        "Пока это только локальный черновик профиля. По мере заполнения блоков здесь появятся вычисленные шкалы и интерпретации.",
      blockSummaries: {
        "big-five": "Блок пока не заполнен.",
        "ipip-ipc": "Блок пока не заполнен.",
        "conflict-profile": "Блок пока не заполнен.",
      },
      scaleNarratives: {},
      disclaimers: [],
    },
    scaleDefinitions: TEST_BLOCKS.flatMap((block) => block.scales),
    versionInfo: {
      productVersion: PRODUCT_VERSION,
      exportVersion: EXPORT_VERSION,
      methodologyVersion: METHODOLOGY_VERSION,
      contentVersion: CONTENT_VERSION,
      conflictModuleVersion: CONFLICT_MODULE_VERSION,
    },
    calculationMeta: {
      calculatedAt: now,
      completenessByBlock: {
        "big-five": 0,
        "ipip-ipc": 0,
        "conflict-profile": 0,
      },
      notes: [],
    },
  };

  return recalculateProfile(profile);
}

export function updateProfileMeta(
  profile: StoredProfile,
  updates: Partial<Pick<ProfileMeta, "displayName" | "about" | "contexts">>,
): StoredProfile {
  return recalculateProfile({
    ...profile,
    profileMeta: {
      ...profile.profileMeta,
      ...updates,
      updatedAt: new Date().toISOString(),
    },
  });
}

export function updateProfileAnswer(
  profile: StoredProfile,
  blockId: BlockId,
  itemId: string,
  answer: LikertValue,
  pageNumber: number,
): StoredProfile {
  const nextRawAnswers = {
    ...profile.rawAnswers,
    [blockId]: profile.rawAnswers[blockId].map((response) =>
      response.itemId === itemId
        ? {
            ...response,
            answer,
            answeredAt: new Date().toISOString(),
          }
        : response,
    ),
  } as StoredProfile["rawAnswers"];

  const nextProfile = recalculateProfile({
    ...profile,
    rawAnswers: nextRawAnswers,
  });

  nextProfile.assessmentProgress[blockId].lastVisitedPage = pageNumber;
  nextProfile.profileMeta.updatedAt = new Date().toISOString();

  return nextProfile;
}

export function recalculateProfile(profile: StoredProfile): StoredProfile {
  const bigFive = scoreBigFive(profile.rawAnswers["big-five"]);
  const ipipIpc = scoreIpipIpc(profile.rawAnswers["ipip-ipc"]);
  const conflict = scoreConflictProfile(profile.rawAnswers["conflict-profile"]);

  const derivedScores = [...bigFive.derived, ...ipipIpc.derived, ...conflict.derived];
  const assessmentProgress = buildAssessmentProgress(
    profile.rawAnswers,
    profile.assessmentProgress,
  );
  const textualInterpretation = createTextualInterpretation({
    bigFive: bigFive.scales,
    ipipIpc: ipipIpc.scales,
    conflict: conflict.scales,
    derivedScores,
    displayName: profile.profileMeta.displayName,
  });

  return {
    ...profile,
    profileMeta: {
      ...profile.profileMeta,
      status: Object.values(assessmentProgress).every((entry) => entry.status === "completed")
        ? "ready"
        : "draft",
      updatedAt: new Date().toISOString(),
    },
    assessmentProgress,
    scoring: {
      "big-five": bigFive.scales,
      "ipip-ipc": ipipIpc.scales,
      "conflict-profile": conflict.scales,
    },
    derivedScores,
    textualInterpretation,
    calculationMeta: {
      calculatedAt: new Date().toISOString(),
      completenessByBlock: {
        "big-five": assessmentProgress["big-five"].completionRatio,
        "ipip-ipc": assessmentProgress["ipip-ipc"].completionRatio,
        "conflict-profile": assessmentProgress["conflict-profile"].completionRatio,
      },
      notes: [
        "Big Five scores are stored as descriptive normalized means on a 1-5 response scale.",
        "IPC axes are weighted octant projections derived from the open IPIP-IPC geometry.",
        "Conflict-profile composites are transparent internal aggregates for v1 and are not normative scores.",
      ],
    },
  };
}

function buildAssessmentProgress(
  rawAnswers: FullProfileExport["rawAnswers"],
  previous?: FullProfileExport["assessmentProgress"],
) {
  return Object.fromEntries(
    Object.entries(rawAnswers).map(([blockId, responses]) => [
      blockId,
      getProgressForBlock(blockId as BlockId, responses, previous?.[blockId as BlockId]),
    ]),
  ) as Record<BlockId, AssessmentProgress>;
}

function getProgressForBlock(
  blockId: BlockId,
  responses: QuestionResponse[],
  previous?: AssessmentProgress,
): AssessmentProgress {
  const answered = responses.filter((response) => response.answer !== null).length;
  const total = responses.length;
  const completionRatio = total ? Number((answered / total).toFixed(2)) : 0;
  const status =
    answered === 0 ? "not-started" : answered === total ? "completed" : "in-progress";

  return {
    blockId,
    answered,
    total,
    completionRatio,
    status,
    lastVisitedPage: previous?.lastVisitedPage ?? 0,
    startedAt: previous?.startedAt ?? (answered > 0 ? new Date().toISOString() : null),
    completedAt:
      status === "completed" ? previous?.completedAt ?? new Date().toISOString() : null,
  };
}
