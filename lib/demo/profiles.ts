import { createEmptyProfile, recalculateProfile } from "@/lib/scoring/profile";
import type { LikertValue, ProfileContext, QuestionResponse } from "@/types/assessment";
import type { StoredProfile } from "@/types/profile";

type ScaleAnswerMap = Record<string, LikertValue>;

interface DemoProfileDefinition {
  id: string;
  displayName: string;
  about: string;
  contexts: ProfileContext[];
  createdAt: string;
  scaleAnswers: {
    "big-five": ScaleAnswerMap;
    "ipip-ipc": ScaleAnswerMap;
    "conflict-profile": ScaleAnswerMap;
  };
}

const DEMO_PROFILES: DemoProfileDefinition[] = [
  {
    id: "demo-aleksey-orlov",
    displayName: "Алексей Орлов",
    about:
      "Спокойный, собранный и вдумчивый. Обычно предпочитает ясность, структуру и содержательные разговоры без лишнего драматизма.",
    contexts: ["for-self", "relationships", "work"],
    createdAt: "2026-02-12T09:30:00.000Z",
    scaleAnswers: {
      "big-five": {
        "openness-to-new": 4,
        conscientiousness: 5,
        extraversion: 2,
        agreeableness: 4,
        "emotional-sensitivity": 2,
      },
      "ipip-ipc": {
        PA: 2,
        BC: 1,
        DE: 2,
        FG: 3,
        HI: 2,
        JK: 4,
        LM: 5,
        NO: 2,
      },
      "conflict-profile": {
        "direct-confrontation": 4,
        avoidance: 2,
        defensiveness: 2,
        "silent-withdrawal": 2,
        "tension-accumulation": 3,
        harshness: 1,
        "dialogue-readiness": 5,
        "repair-capacity": 5,
      },
    },
  },
  {
    id: "demo-yuliya-kovaleva",
    displayName: "Юлия Ковалёва",
    about:
      "Энергичная, яркая и быстро включающаяся в контакт. Легко берёт инициативу, но в напряжении может отвечать острее и быстрее.",
    contexts: ["for-self", "friendship", "relationships"],
    createdAt: "2026-02-14T18:10:00.000Z",
    scaleAnswers: {
      "big-five": {
        "openness-to-new": 5,
        conscientiousness: 3,
        extraversion: 5,
        agreeableness: 2,
        "emotional-sensitivity": 4,
      },
      "ipip-ipc": {
        PA: 4,
        BC: 3,
        DE: 2,
        FG: 1,
        HI: 1,
        JK: 2,
        LM: 4,
        NO: 5,
      },
      "conflict-profile": {
        "direct-confrontation": 5,
        avoidance: 1,
        defensiveness: 4,
        "silent-withdrawal": 1,
        "tension-accumulation": 2,
        harshness: 4,
        "dialogue-readiness": 3,
        "repair-capacity": 3,
      },
    },
  },
];

function normalizeLikert(value: number): LikertValue {
  const rounded = Math.max(1, Math.min(5, Math.round(value)));
  return rounded as LikertValue;
}

function applyScaleAnswers(
  responses: QuestionResponse[],
  answers: ScaleAnswerMap,
  createdAt: string,
) {
  return responses.map((response, index) => {
    const desiredScore = answers[response.scaleKey] ?? 3;
    const answer = normalizeLikert(
      response.reverseKeyed ? 6 - desiredScore : desiredScore,
    );

    return {
      ...response,
      answer,
      answeredAt: new Date(
        Date.parse(createdAt) + index * 60_000,
      ).toISOString(),
    };
  });
}

function finalizeDemoProfile(
  profile: StoredProfile,
  createdAt: string,
): StoredProfile {
  const finalized = recalculateProfile(profile);

  return {
    ...finalized,
    profileMeta: {
      ...finalized.profileMeta,
      createdAt,
      updatedAt: new Date(Date.parse(createdAt) + 86_400_000).toISOString(),
      status: "ready",
    },
    assessmentProgress: Object.fromEntries(
      Object.entries(finalized.assessmentProgress).map(([blockId, progress]) => [
        blockId,
        {
          ...progress,
          lastVisitedPage: progress.total - 1,
          startedAt: createdAt,
          completedAt: new Date(
            Date.parse(createdAt) + 86_400_000,
          ).toISOString(),
        },
      ]),
    ) as StoredProfile["assessmentProgress"],
    calculationMeta: {
      ...finalized.calculationMeta,
      calculatedAt: new Date(Date.parse(createdAt) + 86_400_000).toISOString(),
    },
  };
}

function buildDemoProfile(definition: DemoProfileDefinition): StoredProfile {
  const baseProfile = createEmptyProfile({
    id: definition.id,
    displayName: definition.displayName,
    about: definition.about,
    contexts: definition.contexts,
  });

  const completedProfile: StoredProfile = {
    ...baseProfile,
    rawAnswers: {
      "big-five": applyScaleAnswers(
        baseProfile.rawAnswers["big-five"],
        definition.scaleAnswers["big-five"],
        definition.createdAt,
      ),
      "ipip-ipc": applyScaleAnswers(
        baseProfile.rawAnswers["ipip-ipc"],
        definition.scaleAnswers["ipip-ipc"],
        definition.createdAt,
      ),
      "conflict-profile": applyScaleAnswers(
        baseProfile.rawAnswers["conflict-profile"],
        definition.scaleAnswers["conflict-profile"],
        definition.createdAt,
      ),
    },
  };

  return finalizeDemoProfile(completedProfile, definition.createdAt);
}

export function createDemoProfiles(): StoredProfile[] {
  return DEMO_PROFILES.map(buildDemoProfile);
}
