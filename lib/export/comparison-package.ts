import { contextLabel } from "@/lib/presenters";
import type { ComparisonPackage, ComparisonResponseDifference, ComparisonScaleDifference } from "@/types/export";
import type { BlockId, DerivedScore, ScaleScore } from "@/types/assessment";
import type { FullProfileExport } from "@/types/profile";

function getComparableEntries(profile: FullProfileExport) {
  const coreEntries: Array<readonly [BlockId, ScaleScore]> = [
    ...profile.scoring["big-five"].map((score) => ["big-five", score] as const),
    ...profile.scoring["ipip-ipc"].map((score) => ["ipip-ipc", score] as const),
    ...profile.scoring["conflict-profile"].map((score) => ["conflict-profile", score] as const),
  ];

  const derivedEntries: Array<readonly [BlockId, DerivedScore]> = profile.derivedScores.map((score) => [
    score.blockId,
    score,
  ]);

  return {
    coreEntries,
    derivedEntries,
  };
}

function compareScaleEntries(
  left: FullProfileExport,
  right: FullProfileExport,
): ComparisonScaleDifference[] {
  const leftEntries = getComparableEntries(left);
  const rightCore = new Map(
    leftEntries.coreEntries
      .map((entry) => entry[1])
      .map((score) => [`core:${score.blockId}:${score.key}`, score]),
  );
  const rightDerived = new Map(
    leftEntries.derivedEntries
      .map((entry) => entry[1])
      .map((score) => [`derived:${score.blockId}:${score.key}`, score]),
  );

  const comparisons: ComparisonScaleDifference[] = [];

  for (const score of [
    ...right.scoring["big-five"],
    ...right.scoring["ipip-ipc"],
    ...right.scoring["conflict-profile"],
  ]) {
    const leftScore = rightCore.get(`core:${score.blockId}:${score.key}`);
    comparisons.push(buildScaleDifference(score.blockId, score.key, score.label, leftScore?.normalized ?? null, score.normalized));
  }

  for (const score of right.derivedScores) {
    const leftScore = rightDerived.get(`derived:${score.blockId}:${score.key}`);
    comparisons.push(buildScaleDifference(score.blockId, score.key, score.label, leftScore?.normalized ?? null, score.normalized));
  }

  return comparisons.sort(
    (leftDiff, rightDiff) => (rightDiff.absoluteDifference ?? 0) - (leftDiff.absoluteDifference ?? 0),
  );
}

function buildScaleDifference(
  blockId: BlockId,
  scaleKey: string,
  label: string,
  leftValue: number | null,
  rightValue: number | null,
): ComparisonScaleDifference {
  if (leftValue === null || rightValue === null) {
    return {
      blockId,
      scaleKey,
      label,
      leftValue,
      rightValue,
      absoluteDifference: null,
      direction: "insufficient-data",
    };
  }

  if (leftValue === rightValue) {
    return {
      blockId,
      scaleKey,
      label,
      leftValue,
      rightValue,
      absoluteDifference: 0,
      direction: "equal",
    };
  }

  return {
    blockId,
    scaleKey,
    label,
    leftValue,
    rightValue,
    absoluteDifference: Math.abs(leftValue - rightValue),
    direction: leftValue > rightValue ? "left-higher" : "right-higher",
  };
}

function compareResponses(
  left: FullProfileExport,
  right: FullProfileExport,
): Record<BlockId, ComparisonResponseDifference[]> {
  const blockIds: BlockId[] = ["big-five", "ipip-ipc", "conflict-profile"];

  return Object.fromEntries(
    blockIds.map((blockId) => {
      const rightById = new Map(right.rawAnswers[blockId].map((response) => [response.itemId, response]));

      const differences = left.rawAnswers[blockId].map((leftResponse) => {
        const rightResponse = rightById.get(leftResponse.itemId);
        const leftAnswer = leftResponse.answer;
        const rightAnswer = rightResponse?.answer ?? null;

        return {
          blockId,
          itemId: leftResponse.itemId,
          question: leftResponse.russianText,
          scaleKey: leftResponse.scaleKey,
          leftAnswer,
          rightAnswer,
          absoluteDifference:
            leftAnswer === null || rightAnswer === null
              ? null
              : Math.abs(leftAnswer - rightAnswer),
        };
      });

      return [blockId, differences];
    }),
  ) as Record<BlockId, ComparisonResponseDifference[]>;
}

export function createComparisonPackage(
  left: FullProfileExport,
  right: FullProfileExport,
): ComparisonPackage {
  const scaleComparisons = compareScaleEntries(left, right);
  const responseComparisons = compareResponses(left, right);
  const closestScales = scaleComparisons
    .filter((entry) => entry.absoluteDifference !== null)
    .sort((a, b) => (a.absoluteDifference ?? 99) - (b.absoluteDifference ?? 99))
    .slice(0, 6);
  const furthestScales = scaleComparisons
    .filter((entry) => entry.absoluteDifference !== null)
    .slice(0, 6);

  return {
    packageType: "comparison-package-v1",
    createdAt: new Date().toISOString(),
    leftProfile: left,
    rightProfile: right,
    scaleComparisons,
    responseComparisons,
    summary: {
      overview:
        "Пакет собирает два полных профиля рядом, показывает различия по шкалам и сырым ответам, но не делает автоматический вывод о совместимости.",
      closestScales,
      furthestScales,
    },
  };
}

function renderComparisonTable(title: string, rows: ComparisonScaleDifference[]) {
  return [
    `## ${title}`,
    "",
    "| Шкала | Левый профиль | Правый профиль | Разница |",
    "| --- | ---: | ---: | ---: |",
    ...rows.map(
      (row) =>
        `| ${row.label} | ${row.leftValue ?? "—"} | ${row.rightValue ?? "—"} | ${row.absoluteDifference ?? "—"} |`,
    ),
  ].join("\n");
}

function renderProfileSection(title: string, profile: FullProfileExport) {
  return [
    `## ${title}`,
    "",
    `- Имя: ${profile.profileMeta.displayName}`,
    `- Контексты: ${profile.profileMeta.contexts.map(contextLabel).join(", ") || "не указаны"}`,
    `- О себе: ${profile.profileMeta.about || "—"}`,
    `- Короткий профиль: ${profile.textualInterpretation.shortProfile}`,
    "",
  ].join("\n");
}

function renderResponses(title: string, rows: ComparisonResponseDifference[]) {
  return [
    `## ${title}`,
    "",
    "| ID | Шкала | Левый ответ | Правый ответ | Разница | Вопрос |",
    "| --- | --- | ---: | ---: | ---: | --- |",
    ...rows.map(
      (row) =>
        `| ${row.itemId} | ${row.scaleKey} | ${row.leftAnswer ?? "—"} | ${row.rightAnswer ?? "—"} | ${row.absoluteDifference ?? "—"} | ${row.question.replaceAll("|", "\\|")} |`,
    ),
  ].join("\n");
}

export function generateComparisonMarkdown(pkg: ComparisonPackage) {
  return [
    "# Comparison Package",
    "",
    "## Что это за пакет",
    "",
    pkg.summary.overview,
    "",
    renderProfileSection("Профиль 1", pkg.leftProfile),
    renderProfileSection("Профиль 2", pkg.rightProfile),
    renderComparisonTable("Ближайшие шкалы", pkg.summary.closestScales),
    "",
    renderComparisonTable("Наиболее заметные различия", pkg.summary.furthestScales),
    "",
    renderComparisonTable("Все сравнения по шкалам", pkg.scaleComparisons),
    "",
    renderResponses("Big Five: сырые ответы рядом", pkg.responseComparisons["big-five"]),
    "",
    renderResponses("IPIP-IPC: сырые ответы рядом", pkg.responseComparisons["ipip-ipc"]),
    "",
    renderResponses(
      "Конфликтный профиль: сырые ответы рядом",
      pkg.responseComparisons["conflict-profile"],
    ),
  ].join("\n");
}
