import type { FullProfileExport } from "@/types/profile";

export interface AnalysisMeta {
  generatedAt: string;
  model: string;
  source: "gemini";
}

export interface ProfileAnalysisContent {
  summary: string;
  keyObservations: string[];
  attentionAreas: string[];
  interpersonalReading: string[];
  conflictReading: string[];
  howToReadWithoutLabels: string[];
  disclaimer: string;
}

export interface CompareAnalysisContent {
  summary: string;
  similarities: string[];
  differences: string[];
  interactionStrengths: string[];
  frictionPoints: string[];
  communicationNotes: string[];
  disclaimer: string;
}

export interface SavedProfileAnalysis {
  kind: "profile";
  profileId: string;
  profileUpdatedAt: string;
  meta: AnalysisMeta;
  content: ProfileAnalysisContent;
}

export interface SavedCompareAnalysis {
  kind: "compare";
  pairKey: string;
  leftProfileId: string;
  rightProfileId: string;
  leftProfileUpdatedAt: string;
  rightProfileUpdatedAt: string;
  meta: AnalysisMeta;
  content: CompareAnalysisContent;
}

export type SavedAnalysisRecord = SavedProfileAnalysis | SavedCompareAnalysis;

export function createCompareAnalysisKey(
  leftProfileId: string,
  rightProfileId: string,
) {
  return [leftProfileId, rightProfileId].sort().join("::");
}

export function isProfileAnalysisOutdated(
  analysis: SavedProfileAnalysis | null,
  profile: FullProfileExport | null,
) {
  if (!analysis || !profile) {
    return false;
  }

  return analysis.profileUpdatedAt !== profile.profileMeta.updatedAt;
}

export function isCompareAnalysisOutdated(
  analysis: SavedCompareAnalysis | null,
  leftProfile: FullProfileExport | null,
  rightProfile: FullProfileExport | null,
) {
  if (!analysis || !leftProfile || !rightProfile) {
    return false;
  }

  const idsMatch =
    createCompareAnalysisKey(
      analysis.leftProfileId,
      analysis.rightProfileId,
    ) ===
    createCompareAnalysisKey(
      leftProfile.profileMeta.id,
      rightProfile.profileMeta.id,
    );

  if (!idsMatch) {
    return true;
  }

  return (
    analysis.leftProfileUpdatedAt !== leftProfile.profileMeta.updatedAt ||
    analysis.rightProfileUpdatedAt !== rightProfile.profileMeta.updatedAt
  );
}
