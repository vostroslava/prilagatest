import { TEST_BLOCKS_BY_ID } from "@/content/tests";
import { contextLabel } from "@/lib/presenters";
import type { BlockId, DerivedScore, QuestionResponse, ScaleScore } from "@/types/assessment";
import type { FullProfileExport } from "@/types/profile";

function renderScaleLines(title: string, scales: ScaleScore[]) {
  const rows = scales.map(
    (scale) =>
      `| ${scale.shortLabel} | ${scale.rawMean ?? "—"} | ${scale.normalized ?? "—"} | ${scale.band ?? "—"} |`,
  );

  return [`## ${title}`, "", "| Шкала | Среднее | Нормализовано | Уровень |", "| --- | ---: | ---: | --- |", ...rows].join("\n");
}

function renderDerivedLines(title: string, scores: DerivedScore[]) {
  if (!scores.length) {
    return "";
  }

  const rows = scores.map(
    (score) =>
      `| ${score.label} | ${score.value ?? "—"} | ${score.normalized ?? "—"} | ${score.note ?? ""} |`,
  );

  return [`## ${title}`, "", "| Показатель | Значение | Нормализовано | Комментарий |", "| --- | ---: | ---: | --- |", ...rows].join("\n");
}

function renderResponses(blockId: BlockId, responses: QuestionResponse[]) {
  const block = TEST_BLOCKS_BY_ID[blockId];
  const lines = [
    `## ${block.title}: сырые ответы`,
    "",
    "| № | ID | Шкала | Ответ | Оригинал | Русский текст |",
    "| ---: | --- | --- | ---: | --- | --- |",
    ...responses.map(
      (response) =>
        `| ${response.order} | ${response.itemId} | ${response.scaleKey} | ${response.answer ?? "—"} | ${response.originalText.replaceAll("|", "\\|")} | ${response.russianText.replaceAll("|", "\\|")} |`,
    ),
  ];

  return lines.join("\n");
}

export function generateProfileMarkdown(profile: FullProfileExport) {
  const derivedByBlock = {
    "big-five": profile.derivedScores.filter((score) => score.blockId === "big-five"),
    "ipip-ipc": profile.derivedScores.filter((score) => score.blockId === "ipip-ipc"),
    "conflict-profile": profile.derivedScores.filter(
      (score) => score.blockId === "conflict-profile",
    ),
  };

  return [
    `# Полный профиль: ${profile.profileMeta.displayName}`,
    "",
    "## Метаданные",
    "",
    `- Локальный ID: ${profile.profileMeta.id}`,
    `- Создан: ${profile.profileMeta.createdAt}`,
    `- Обновлён: ${profile.profileMeta.updatedAt}`,
    `- Язык: ${profile.profileMeta.language}`,
    `- Контексты: ${profile.profileMeta.contexts.map(contextLabel).join(", ") || "не указаны"}`,
    `- Статус: ${profile.profileMeta.status}`,
    `- О себе: ${profile.profileMeta.about || "—"}`,
    "",
    "## Короткий профиль",
    "",
    profile.textualInterpretation.shortProfile,
    "",
    "## Подробный профиль",
    "",
    profile.textualInterpretation.detailedProfile,
    "",
    renderScaleLines("Большая пятёрка", profile.scoring["big-five"]),
    "",
    renderDerivedLines("Big Five: производные показатели", derivedByBlock["big-five"]),
    "",
    renderScaleLines("IPIP-IPC: восемь секторов", profile.scoring["ipip-ipc"]),
    "",
    renderDerivedLines("IPIP-IPC: сводные оси", derivedByBlock["ipip-ipc"]),
    "",
    renderScaleLines("Конфликтный профиль", profile.scoring["conflict-profile"]),
    "",
    renderDerivedLines(
      "Конфликтный профиль: сводные показатели",
      derivedByBlock["conflict-profile"],
    ),
    "",
    renderResponses("big-five", profile.rawAnswers["big-five"]),
    "",
    renderResponses("ipip-ipc", profile.rawAnswers["ipip-ipc"]),
    "",
    renderResponses("conflict-profile", profile.rawAnswers["conflict-profile"]),
    "",
    "## Дисклеймеры",
    "",
    ...profile.textualInterpretation.disclaimers.map((line) => `- ${line}`),
    "",
    "## Version Info",
    "",
    `- Product version: ${profile.versionInfo.productVersion}`,
    `- Export version: ${profile.versionInfo.exportVersion}`,
    `- Methodology version: ${profile.versionInfo.methodologyVersion}`,
    `- Content version: ${profile.versionInfo.contentVersion}`,
    `- Conflict module version: ${profile.versionInfo.conflictModuleVersion}`,
  ].join("\n");
}

export function generateProfileSummary(profile: FullProfileExport) {
  return [
    `Профиль: ${profile.profileMeta.displayName}`,
    `Контексты: ${profile.profileMeta.contexts.map(contextLabel).join(", ") || "не указаны"}`,
    `Big Five: ${profile.scoring["big-five"]
      .map((scale) => `${scale.shortLabel} ${scale.normalized ?? "—"}`)
      .join(" · ")}`,
    `IPC: ${profile.scoring["ipip-ipc"]
      .map((scale) => `${scale.shortLabel} ${scale.normalized ?? "—"}`)
      .join(" · ")}`,
    `Конфликт: ${profile.scoring["conflict-profile"]
      .map((scale) => `${scale.shortLabel} ${scale.normalized ?? "—"}`)
      .join(" · ")}`,
    `Короткий вывод: ${profile.textualInterpretation.shortProfile}`,
  ].join("\n");
}
