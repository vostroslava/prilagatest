import type { BlockId } from "@/types/assessment";
import type { FullProfileExport } from "@/types/profile";

export interface ComparisonScaleDifference {
  blockId: BlockId;
  scaleKey: string;
  label: string;
  leftValue: number | null;
  rightValue: number | null;
  absoluteDifference: number | null;
  direction: "left-higher" | "right-higher" | "equal" | "insufficient-data";
}

export interface ComparisonResponseDifference {
  blockId: BlockId;
  itemId: string;
  question: string;
  scaleKey: string;
  leftAnswer: number | null;
  rightAnswer: number | null;
  absoluteDifference: number | null;
}

export interface ComparisonPackage {
  packageType: "comparison-package-v1";
  createdAt: string;
  leftProfile: FullProfileExport;
  rightProfile: FullProfileExport;
  scaleComparisons: ComparisonScaleDifference[];
  responseComparisons: Record<BlockId, ComparisonResponseDifference[]>;
  summary: {
    overview: string;
    closestScales: ComparisonScaleDifference[];
    furthestScales: ComparisonScaleDifference[];
  };
}
