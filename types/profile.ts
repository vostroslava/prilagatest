import type {
  BlockId,
  DerivedScore,
  LocaleCode,
  ProfileContext,
  QuestionResponse,
  ScaleDefinition,
  ScaleScore,
} from "@/types/assessment";

export interface AssessmentProgress {
  blockId: BlockId;
  answered: number;
  total: number;
  completionRatio: number;
  status: "not-started" | "in-progress" | "completed";
  lastVisitedPage: number;
  startedAt: string | null;
  completedAt: string | null;
}

export interface ProfileMeta {
  id: string;
  displayName: string;
  about: string;
  language: LocaleCode;
  contexts: ProfileContext[];
  createdAt: string;
  updatedAt: string;
  privacyMode: "local-first";
  status: "draft" | "ready";
}

export interface TextualInterpretation {
  shortProfile: string;
  detailedProfile: string;
  blockSummaries: Record<BlockId, string>;
  scaleNarratives: Record<string, string>;
  disclaimers: string[];
}

export interface CalculationMeta {
  calculatedAt: string;
  completenessByBlock: Record<BlockId, number>;
  notes: string[];
}

export interface VersionInfo {
  productVersion: string;
  exportVersion: string;
  methodologyVersion: string;
  contentVersion: string;
  conflictModuleVersion: string;
}

export interface FullProfileExport {
  exportType: "self-understanding-profile-v1";
  profileMeta: ProfileMeta;
  assessmentProgress: Record<BlockId, AssessmentProgress>;
  rawAnswers: Record<BlockId, QuestionResponse[]>;
  scoring: Record<BlockId, ScaleScore[]>;
  derivedScores: DerivedScore[];
  textualInterpretation: TextualInterpretation;
  scaleDefinitions: ScaleDefinition[];
  versionInfo: VersionInfo;
  calculationMeta: CalculationMeta;
}

export type StoredProfile = FullProfileExport;
