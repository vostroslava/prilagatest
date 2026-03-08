import { bigFiveNarrative, bigFiveOverview, getTopBigFiveScales } from "@/lib/scoring/big-five";
import { conflictNarrative, conflictOverview } from "@/lib/scoring/conflict-profile";
import { ipcOverview, ipipIpcNarrative } from "@/lib/scoring/ipip-ipc";
import type { DerivedScore, ScaleScore } from "@/types/assessment";
import type { TextualInterpretation } from "@/types/profile";

interface TextualInput {
  bigFive: ScaleScore[];
  ipipIpc: ScaleScore[];
  conflict: ScaleScore[];
  derivedScores: DerivedScore[];
  displayName: string;
}

export function createTextualInterpretation(input: TextualInput): TextualInterpretation {
  const bigFiveSummary = bigFiveOverview(input.bigFive);
  const ipcSummary = ipcOverview(
    input.ipipIpc,
    input.derivedScores.filter((score) => score.blockId === "ipip-ipc"),
  );
  const conflictSummary = conflictOverview(
    input.conflict,
    input.derivedScores.filter((score) => score.blockId === "conflict-profile"),
  );

  const topTraits = getTopBigFiveScales(input.bigFive);
  const topTraitsPart = topTraits.length
    ? `На первом плане выглядят ${topTraits.map((scale) => scale.shortLabel.toLowerCase()).join(" и ")}.`
    : "Базовые черты пока заполнены не полностью.";

  const shortProfile = `${topTraitsPart} ${ipcSummary} ${conflictSummary}`;

  const scaleNarratives = Object.fromEntries(
    [
      ...input.bigFive.map((scale) => [scale.key, bigFiveNarrative(scale)]),
      ...input.ipipIpc.map((scale) => [scale.key, ipipIpcNarrative(scale)]),
      ...input.conflict.map((scale) => [scale.key, conflictNarrative(scale)]),
    ],
  ) as Record<string, string>;

  const detailedProfile = [
    `${input.displayName}: личный профиль собран как local-first описание паттернов, а не как диагноз или окончательный вердикт.`,
    bigFiveSummary,
    ipcSummary,
    conflictSummary,
  ].join(" ");

  return {
    shortProfile,
    detailedProfile,
    blockSummaries: {
      "big-five": bigFiveSummary,
      "ipip-ipc": ipcSummary,
      "conflict-profile": conflictSummary,
    },
    scaleNarratives,
    disclaimers: [
      "Результат описывает склонности и рабочие паттерны, а не «истинную сущность» человека.",
      "Блок IPIP-IPC использует адаптированные русские формулировки из открытого английского оригинала.",
      "Конфликтный модуль — внутренний исследовательский блок v1, не академический и не клинический тест.",
    ],
  };
}
