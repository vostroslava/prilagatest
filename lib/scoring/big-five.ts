import { BIG_FIVE_BLOCK } from "@/content/tests/big-five";
import { buildDerivedScore, buildScaleScore, round } from "@/lib/scoring/helpers";
import type { DerivedScore, QuestionResponse, ScaleScore } from "@/types/assessment";

export function scoreBigFive(responses: QuestionResponse[]) {
  const scales = BIG_FIVE_BLOCK.scales
    .filter((scale) => scale.type === "core")
    .map((scale) =>
      buildScaleScore(
        scale,
        responses.filter((response) => response.scaleKey === scale.key),
      ),
    );

  const normalizedValues = scales
    .map((scale) => scale.normalized)
    .filter((value): value is number => value !== null);

  const spread =
    normalizedValues.length === scales.length
      ? Math.max(...normalizedValues) - Math.min(...normalizedValues)
      : null;

  const derived: DerivedScore[] = [
    buildDerivedScore(
      "big-five-trait-spread",
      "big-five",
      "Разброс выраженности черт",
      "Разница между самой высокой и самой низкой шкалой Big Five. Чем выше показатель, тем заметнее выражен контраст между чертами.",
      spread,
      spread,
      "Это описательный показатель без нормативной интерпретации.",
    ),
  ];

  return {
    scales,
    derived,
  };
}

export function getTopBigFiveScales(scales: ScaleScore[]) {
  return [...scales]
    .filter((scale) => scale.normalized !== null)
    .sort((left, right) => (right.normalized ?? 0) - (left.normalized ?? 0))
    .slice(0, 2);
}

export function getLowestBigFiveScale(scales: ScaleScore[]) {
  return [...scales]
    .filter((scale) => scale.normalized !== null)
    .sort((left, right) => (left.normalized ?? 0) - (right.normalized ?? 0))[0] ?? null;
}

export function bigFiveNarrative(scale: ScaleScore) {
  if (scale.band === null) {
    return "Недостаточно ответов для интерпретации.";
  }

  const templates: Record<string, Record<NonNullable<ScaleScore["band"]>, string>> = {
    "openness-to-new": {
      low: "Скорее предпочитает понятное, знакомое и проверенное новым экспериментам.",
      medium:
        "Может сочетать интерес к новому с потребностью опираться на практичные и уже понятные формы.",
      high: "Часто тянется к идеям, образам, сложным темам и новым способам смотреть на вещи.",
    },
    conscientiousness: {
      low: "Организованность и структура даются не всегда устойчиво; хаос и импровизация могут захватывать пространство.",
      medium:
        "Обычно способен(на) держать порядок, но не стремится подчинять всё жёсткому режиму и регламенту.",
      high: "Склонен(на) к порядку, последовательности, вниманию к деталям и внутренней дисциплине.",
    },
    extraversion: {
      low: "Чаще бережёт социальную энергию и не стремится постоянно быть заметным в группе.",
      medium:
        "Может быть включённым(ой) в общение, но не делает постоянную внешнюю активность обязательным режимом.",
      high: "Обычно легче проявляется через внешнюю энергию, разговор, видимость и контакт с людьми.",
    },
    agreeableness: {
      low: "Скорее держит личные границы жёстко и не всегда ставит эмоциональный комфорт других в приоритет.",
      medium:
        "Может сочетать уважение к другим с готовностью настаивать на своём, если это важно.",
      high: "Обычно проявляется через мягкость, эмпатию, внимание к чувствам других и желание не ранить.",
    },
    "emotional-sensitivity": {
      low: "Чаще сохраняет эмоциональную устойчивость и быстрее возвращается к внутреннему равновесию.",
      medium:
        "Чувствительность к напряжению есть, но она не выглядит доминирующей осью поведения.",
      high: "Напряжение, тревога или колебания настроения могут ощущаться заметно и быстро влиять на состояние.",
    },
  };

  return templates[scale.key]?.[scale.band] ?? "Интерпретация недоступна.";
}

export function bigFiveOverview(scales: ScaleScore[]) {
  const top = getTopBigFiveScales(scales);
  const low = getLowestBigFiveScale(scales);

  if (!top.length) {
    return "Блок Big Five пока заполнен не полностью, поэтому вывод остаётся предварительным.";
  }

  const topLabels = top.map((scale) => scale.shortLabel.toLowerCase()).join(" и ");
  const lowPart = low ? ` Менее выраженной выглядит шкала «${low.shortLabel}».` : "";

  return `Сейчас профиль сильнее всего тяготеет к «${topLabels}».${lowPart}`;
}

export function averageNormalized(scales: ScaleScore[]) {
  const values = scales
    .map((scale) => scale.normalized)
    .filter((value): value is number => value !== null);

  if (!values.length) {
    return null;
  }

  return round(values.reduce((sum, value) => sum + value, 0) / values.length);
}
