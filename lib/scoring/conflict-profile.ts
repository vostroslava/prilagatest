import { buildDerivedScore, buildScaleScore, normalizeSignedRange, round } from "@/lib/scoring/helpers";
import { CONFLICT_PROFILE_BLOCK } from "@/content/tests/conflict-profile";
import type { DerivedScore, QuestionResponse, ScaleScore } from "@/types/assessment";

export function scoreConflictProfile(responses: QuestionResponse[]) {
  const scales = CONFLICT_PROFILE_BLOCK.scales
    .filter((scale) => scale.type === "core")
    .map((scale) =>
      buildScaleScore(
        scale,
        responses.filter((response) => response.scaleKey === scale.key),
      ),
    );

  const byKey = Object.fromEntries(scales.map((scale) => [scale.key, scale])) as Record<
    string,
    ScaleScore
  >;

  const engagementBase = meanScaleValues([
    byKey["direct-confrontation"],
    byKey["dialogue-readiness"],
  ]);
  const withdrawalBase = meanScaleValues([
    byKey.avoidance,
    byKey["silent-withdrawal"],
    byKey["tension-accumulation"],
  ]);
  const reactivityBase = meanScaleValues([
    byKey.defensiveness,
    byKey.harshness,
    byKey["tension-accumulation"],
  ]);
  const repairBase = meanScaleValues([
    byKey["dialogue-readiness"],
    byKey["repair-capacity"],
    invertFivePoint(byKey["tension-accumulation"].rawMean),
  ]);

  const engagementVsWithdrawal =
    engagementBase === null || withdrawalBase === null
      ? null
      : round(engagementBase - withdrawalBase);

  const derived: DerivedScore[] = [
    buildDerivedScore(
      "engagement-vs-withdrawal",
      "conflict-profile",
      "Вовлечение / уход",
      "Положительные значения означают большую вероятность входить в трудный разговор, отрицательные — уходить от него.",
      engagementVsWithdrawal,
      normalizeSignedRange(engagementVsWithdrawal, -4, 4),
      "Сводный показатель построен на сочетании прямоты, диалогичности, избегания и ухода в молчание.",
    ),
    buildDerivedScore(
      "reactivity-level",
      "conflict-profile",
      "Реактивность",
      "Чем выше показатель, тем заметнее защитность, резкость и накопленное напряжение в конфликте.",
      reactivityBase,
      reactivityBase === null ? null : round(((reactivityBase - 1) / 4) * 100),
    ),
    buildDerivedScore(
      "repair-potential",
      "conflict-profile",
      "Потенциал восстановления",
      "Чем выше показатель, тем проще оставаться в диалоге и возвращаться к контакту после ссоры.",
      repairBase,
      repairBase === null ? null : round(((repairBase - 1) / 4) * 100),
    ),
  ];

  return {
    scales,
    derived,
  };
}

function meanScaleValues(scales: Array<ScaleScore | number | null>) {
  const values = scales
    .map((scale) => (typeof scale === "number" ? scale : scale?.rawMean ?? null))
    .filter((value): value is number => value !== null);

  if (!values.length || values.length !== scales.length) {
    return null;
  }

  return round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function invertFivePoint(value: number | null) {
  if (value === null) {
    return null;
  }

  return 6 - value;
}

export function conflictNarrative(scale: ScaleScore) {
  if (scale.band === null) {
    return "Недостаточно ответов для интерпретации.";
  }

  const templates: Record<string, Record<NonNullable<ScaleScore["band"]>, string>> = {
    "direct-confrontation": {
      low: "Скорее не стремится входить в трудный разговор напрямую.",
      medium: "Может поднимать трудные темы, но не делает прямой вход в конфликт универсальным инструментом.",
      high: "Скорее предпочитает обозначить проблему прямо и не оставлять её только внутри.",
    },
    avoidance: {
      low: "Уход от темы выражен слабо; неудобный разговор обычно не откладывается автоматически.",
      medium: "Иногда предпочитает отложить разговор, но это не единственный способ справляться с напряжением.",
      high: "Есть заметная склонность отступать, переносить или обходить конфликтную тему.",
    },
    defensiveness: {
      low: "Защитная реакция обычно не захватывает разговор сразу.",
      medium: "Оправдание и защита включаются ситуативно, особенно в чувствительных темах.",
      high: "Замечается быстрая внутренняя мобилизация на защиту своей позиции.",
    },
    "silent-withdrawal": {
      low: "Резкое молчание и закрытие контакта не выглядят базовой привычкой.",
      medium: "Молчание может появляться под сильной нагрузкой, но не всегда определяет весь конфликт.",
      high: "Есть склонность резко сокращать контакт, когда разговор становится болезненным.",
    },
    "tension-accumulation": {
      low: "Напряжение обычно перерабатывается относительно быстро.",
      medium: "Остаточное напряжение возможно, но не всегда держится долго.",
      high: "Напряжение может долго сохраняться внутри даже после внешнего завершения спора.",
    },
    harshness: {
      low: "Жёсткость формулировок проявляется редко.",
      medium: "Резкость может появляться, но не выглядит устойчивым стилем.",
      high: "В напряжении речь может быстро становиться жёсткой и режущей.",
    },
    "dialogue-readiness": {
      low: "Удерживать разговор в плоскости сути бывает трудно.",
      medium: "Есть готовность обсуждать проблему, но она зависит от контекста и состояния.",
      high: "Даже в неприятной теме заметна готовность говорить по существу, а не только защищаться.",
    },
    "repair-capacity": {
      low: "Возврат к контакту после напряжения может даваться тяжело и не сразу.",
      medium: "Восстановление возможно, но не всегда происходит быстро.",
      high: "Есть склонность возвращаться к связи и восстанавливать контакт после ссоры.",
    },
  };

  return templates[scale.key]?.[scale.band] ?? "Интерпретация недоступна.";
}

export function conflictOverview(scales: ScaleScore[], derived: DerivedScore[]) {
  const engagement = derived.find((score) => score.key === "engagement-vs-withdrawal");
  const reactivity = derived.find((score) => score.key === "reactivity-level");
  const repair = derived.find((score) => score.key === "repair-potential");

  const orientation =
    engagement?.normalized == null
      ? "ориентация на вовлечение в разговор пока не определена"
      : engagement.normalized >= 60
        ? "скорее остаётся в контакте и идёт в разговор"
        : engagement.normalized <= 40
          ? "чаще тяготеет к уходу, отсрочке или закрытию контакта"
          : "между вовлечением и уходом нет резкого перекоса";

  const reactivityLabel =
    reactivity?.normalized == null
      ? "реактивность пока не определена"
      : reactivity.normalized >= 60
        ? "реактивность заметная"
        : reactivity.normalized <= 40
          ? "реактивность выглядит сдержанной"
          : "реактивность умеренная";

  const repairLabel =
    repair?.normalized == null
      ? "потенциал восстановления пока не определён"
      : repair.normalized >= 60
        ? "после напряжения связь обычно проще восстанавливать"
        : repair.normalized <= 40
          ? "после напряжения возвращение к контакту может даваться трудно"
          : "восстановление после конфликта зависит от контекста";

  return `В конфликте профиль сейчас показывает: ${orientation}; ${reactivityLabel}; ${repairLabel}.`;
}
