export type LocaleCode = "ru";

export type BlockId = "big-five" | "ipip-ipc" | "conflict-profile";

export type ProfileContext =
  | "for-self"
  | "relationships"
  | "friendship"
  | "work"
  | "other";

export type LikertValue = 1 | 2 | 3 | 4 | 5;

export type TranslationStatus = "official" | "adapted" | "internal";

export interface InstrumentSource {
  instrumentId: string;
  instrumentTitle: string;
  sourceUrl: string;
  usageNotes: string;
  translationStatus: TranslationStatus;
}

export interface ScaleDefinition {
  key: string;
  blockId: BlockId;
  label: string;
  shortLabel: string;
  scientificLabel: string;
  description: string;
  type: "core" | "derived";
  sourceScale?: string;
}

export interface QuestionDefinition {
  blockId: BlockId;
  itemId: string;
  order: number;
  originalText: string;
  russianText: string;
  scaleKey: string;
  scientificScale: string;
  reverseKeyed: boolean;
  source: InstrumentSource;
}

export interface QuestionResponse extends QuestionDefinition {
  answer: LikertValue | null;
  answeredAt: string | null;
}

export interface BlockDefinition {
  id: BlockId;
  order: number;
  title: string;
  subtitle: string;
  description: string;
  disclosure: string;
  questions: QuestionDefinition[];
  scales: ScaleDefinition[];
}

export interface LikertOption {
  value: LikertValue;
  label: string;
  description: string;
}

export type ScoreBand = "low" | "medium" | "high";

export interface ScaleScore {
  key: string;
  blockId: BlockId;
  label: string;
  shortLabel: string;
  scientificLabel: string;
  rawMean: number | null;
  rawSum: number;
  normalized: number | null;
  answeredItems: number;
  totalItems: number;
  band: ScoreBand | null;
  sourceScale?: string;
  note?: string;
}

export interface DerivedScore {
  key: string;
  blockId: BlockId;
  label: string;
  description: string;
  value: number | null;
  normalized: number | null;
  note?: string;
}
