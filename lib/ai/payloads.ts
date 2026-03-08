import { createComparisonPackage } from "@/lib/export/comparison-package";
import type { FullProfileExport } from "@/types/profile";

function serializeBlockResponses(profile: FullProfileExport, blockId: keyof FullProfileExport["rawAnswers"]) {
  return profile.rawAnswers[blockId].map((response) => ({
    itemId: response.itemId,
    scaleKey: response.scaleKey,
    question: response.russianText,
    answer: response.answer,
  }));
}

export function buildProfileAnalysisPayload(profile: FullProfileExport) {
  const allCoreScores = [
    ...profile.scoring["big-five"],
    ...profile.scoring["ipip-ipc"],
    ...profile.scoring["conflict-profile"],
  ]
    .filter((score) => score.normalized !== null)
    .sort((left, right) => (right.normalized ?? 0) - (left.normalized ?? 0));

  return {
    profile: {
      id: profile.profileMeta.id,
      displayName: profile.profileMeta.displayName,
      about: profile.profileMeta.about,
      contexts: profile.profileMeta.contexts,
      updatedAt: profile.profileMeta.updatedAt,
      shortProfile: profile.textualInterpretation.shortProfile,
      detailedProfile: profile.textualInterpretation.detailedProfile,
    },
    strongestScales: allCoreScores.slice(0, 6).map((score) => ({
      blockId: score.blockId,
      key: score.key,
      label: score.label,
      normalized: score.normalized,
      band: score.band,
    })),
    quietestScales: [...allCoreScores]
      .reverse()
      .slice(0, 6)
      .map((score) => ({
        blockId: score.blockId,
        key: score.key,
        label: score.label,
        normalized: score.normalized,
        band: score.band,
      })),
    scoring: profile.scoring,
    derivedScores: profile.derivedScores,
    blockSummaries: profile.textualInterpretation.blockSummaries,
    scaleNarratives: profile.textualInterpretation.scaleNarratives,
    rawAnswers: {
      "big-five": serializeBlockResponses(profile, "big-five"),
      "ipip-ipc": serializeBlockResponses(profile, "ipip-ipc"),
      "conflict-profile": serializeBlockResponses(profile, "conflict-profile"),
    },
  };
}

export function buildCompareAnalysisPayload(
  leftProfile: FullProfileExport,
  rightProfile: FullProfileExport,
) {
  const comparison = createComparisonPackage(leftProfile, rightProfile);

  return {
    profiles: {
      left: {
        id: leftProfile.profileMeta.id,
        displayName: leftProfile.profileMeta.displayName,
        contexts: leftProfile.profileMeta.contexts,
        shortProfile: leftProfile.textualInterpretation.shortProfile,
        updatedAt: leftProfile.profileMeta.updatedAt,
      },
      right: {
        id: rightProfile.profileMeta.id,
        displayName: rightProfile.profileMeta.displayName,
        contexts: rightProfile.profileMeta.contexts,
        shortProfile: rightProfile.textualInterpretation.shortProfile,
        updatedAt: rightProfile.profileMeta.updatedAt,
      },
    },
    summary: comparison.summary,
    scaleComparisons: comparison.scaleComparisons,
    responseComparisons: comparison.responseComparisons,
  };
}
