import type {
  DerivedScore,
  QuestionResponse,
  ScaleDefinition,
  ScaleScore,
  ScoreBand,
} from "@/types/assessment";

export function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function average(values: number[]) {
  if (!values.length) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function normalizeFivePoint(mean: number | null) {
  if (mean === null) {
    return null;
  }

  return round(((mean - 1) / 4) * 100);
}

export function normalizeSignedRange(value: number | null, min: number, max: number) {
  if (value === null) {
    return null;
  }

  return round(((value - min) / (max - min)) * 100);
}

export function getBand(normalized: number | null): ScoreBand | null {
  if (normalized === null) {
    return null;
  }

  if (normalized < 35) {
    return "low";
  }

  if (normalized > 65) {
    return "high";
  }

  return "medium";
}

export function getKeyedAnswers(
  responses: QuestionResponse[],
  reverseOverride?: boolean,
) {
  return responses
    .filter((response) => response.answer !== null)
    .map((response) => {
      const reverse = reverseOverride ?? response.reverseKeyed;
      return reverse ? 6 - response.answer! : response.answer!;
    });
}

export function buildScaleScore(
  scale: ScaleDefinition,
  responses: QuestionResponse[],
  options?: {
    reverseOverride?: boolean;
    note?: string;
  },
): ScaleScore {
  const keyed = getKeyedAnswers(responses, options?.reverseOverride);
  const rawMean = average(keyed);
  const rawSum = round(keyed.reduce((sum, value) => sum + value, 0));
  const normalized = normalizeFivePoint(rawMean);

  return {
    key: scale.key,
    blockId: scale.blockId,
    label: scale.label,
    shortLabel: scale.shortLabel,
    scientificLabel: scale.scientificLabel,
    rawMean: rawMean === null ? null : round(rawMean),
    rawSum,
    normalized,
    answeredItems: keyed.length,
    totalItems: responses.length,
    band: getBand(normalized),
    sourceScale: scale.sourceScale,
    note: options?.note,
  };
}

export function buildDerivedScore(
  key: string,
  blockId: DerivedScore["blockId"],
  label: string,
  description: string,
  value: number | null,
  normalized: number | null,
  note?: string,
): DerivedScore {
  return {
    key,
    blockId,
    label,
    description,
    value: value === null ? null : round(value),
    normalized: normalized === null ? null : round(normalized),
    note,
  };
}
