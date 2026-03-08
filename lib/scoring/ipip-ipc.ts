import { IPIP_IPC_BLOCK } from "@/content/tests/ipip-ipc";
import {
  buildDerivedScore,
  buildScaleScore,
  normalizeSignedRange,
  round,
} from "@/lib/scoring/helpers";
import type { DerivedScore, QuestionResponse, ScaleScore } from "@/types/assessment";

const SQRT_HALF = Math.SQRT1_2;

export function scoreIpipIpc(responses: QuestionResponse[]) {
  const scales = IPIP_IPC_BLOCK.scales
    .filter((scale) => scale.type === "core")
    .map((scale) =>
      buildScaleScore(
        scale,
        responses.filter((response) => response.scaleKey === scale.key),
      ),
    );

  const octants = Object.fromEntries(scales.map((scale) => [scale.key, scale.rawMean])) as Record<
    string,
    number | null
  >;

  const centered = Object.fromEntries(
    Object.entries(octants).map(([key, value]) => [key, value === null ? null : value - 3]),
  ) as Record<string, number | null>;

  const dominanceRaw = getAxisValue([
    centered.PA,
    centered.NO === null ? null : centered.NO * SQRT_HALF,
    centered.BC === null ? null : centered.BC * SQRT_HALF,
    centered.HI === null ? null : centered.HI * -1,
    centered.JK === null ? null : centered.JK * -SQRT_HALF,
    centered.FG === null ? null : centered.FG * -SQRT_HALF,
  ]);

  const warmthRaw = getAxisValue([
    centered.LM,
    centered.NO === null ? null : centered.NO * SQRT_HALF,
    centered.JK === null ? null : centered.JK * SQRT_HALF,
    centered.DE === null ? null : centered.DE * -1,
    centered.BC === null ? null : centered.BC * -SQRT_HALF,
    centered.FG === null ? null : centered.FG * -SQRT_HALF,
  ]);

  const derived: DerivedScore[] = [
    buildDerivedScore(
      "dominance-axis",
      "ipip-ipc",
      "Доминирование / подстройка",
      "Проекция восьми октантов IPC на ось от более доминирующего стиля к более подстраивающемуся.",
      dominanceRaw,
      normalizeSignedRange(dominanceRaw, -2, 2),
      "Расчёт выполнен как взвешенная проекция октантовых средних значений на углы circumplex.",
    ),
    buildDerivedScore(
      "warmth-axis",
      "ipip-ipc",
      "Теплота / дистанция",
      "Проекция восьми октантов IPC на ось от более тёплого и контактного стиля к более дистанционному.",
      warmthRaw,
      normalizeSignedRange(warmthRaw, -2, 2),
      "Расчёт выполнен как взвешенная проекция октантовых средних значений на углы circumplex.",
    ),
  ];

  return {
    scales,
    derived,
  };
}

function getAxisValue(values: Array<number | null>) {
  const present = values.filter((value): value is number => value !== null);

  if (present.length !== values.length) {
    return null;
  }

  return round(present.reduce((sum, value) => sum + value, 0) / 2.41421356237);
}

export function ipipIpcNarrative(scale: ScaleScore) {
  if (scale.band === null) {
    return "Недостаточно ответов для интерпретации.";
  }

  const templates: Record<string, Record<NonNullable<ScaleScore["band"]>, string>> = {
    PA: {
      low: "Директивность и стремление брать верх выражены слабо.",
      medium: "Способность брать инициативу включается ситуативно, без постоянного давления.",
      high: "Замечается стремление задавать тон, брать слово и влиять на ход разговора.",
    },
    BC: {
      low: "Жёсткая конфронтационность и колкость выражены неярко.",
      medium: "Может спорить и давить, но обычно это не выглядит базовым стилем.",
      high: "Есть заметная склонность спорить жёстко, обострять и заходить в колкий обмен.",
    },
    DE: {
      low: "Эмоциональная дистанция и холодная автономность выражены слабо.",
      medium: "Может держать дистанцию, но без выраженного ухода в холодный стиль.",
      high: "Есть тенденция держать эмоциональную дистанцию и меньше включаться в чужие переживания.",
    },
    FG: {
      low: "Закрытость и социальная незаметность не выглядят основной линией поведения.",
      medium: "Способен(на) регулировать видимость и уединение в зависимости от ситуации.",
      high: "Скорее тянется к приватности, сдержанности и невысокой социальной заметности.",
    },
    HI: {
      low: "Подстройка и сдержанность в самопредъявлении выражены слабо.",
      medium: "Иногда уступает инициативу, но не делает это единственной позицией.",
      high: "Есть привычка уменьшать своё присутствие и оставлять лидерство другим.",
    },
    JK: {
      low: "Уступчивость и мягкая терпеливость выражены неярко.",
      medium: "Скорее способен(на) быть мягким(ой), но не обязательно за счёт собственных интересов.",
      high: "Часто выбирает терпеливую, неагрессивную и не продавливающую манеру.",
    },
    LM: {
      low: "Поддерживающая теплота и открытое участие заметны не всегда.",
      medium: "Может сочетать участие к людям с сохранением собственных границ.",
      high: "Явно выражены поддержка, участие и доброжелательная включённость в других.",
    },
    NO: {
      low: "Социальная экспрессивность и живое включение в группу выражены умеренно или слабо.",
      medium: "Общительность включается по ситуации и не превращается в постоянную сцену.",
      high: "Есть заметная лёгкость в контакте, включении в группу и социальной видимости.",
    },
  };

  return templates[scale.key]?.[scale.band] ?? "Интерпретация недоступна.";
}

export function ipcOverview(scales: ScaleScore[], derived: DerivedScore[]) {
  const strongest = [...scales]
    .filter((scale) => scale.normalized !== null)
    .sort((left, right) => (right.normalized ?? 0) - (left.normalized ?? 0))[0];

  const dominance = derived.find((score) => score.key === "dominance-axis");
  const warmth = derived.find((score) => score.key === "warmth-axis");

  if (!strongest) {
    return "Пока недостаточно ответов, чтобы описать межличностный стиль.";
  }

  const dominanceLabel =
    dominance?.normalized == null
      ? "ось доминирования пока не определена"
      : dominance.normalized >= 60
        ? "стиль тяготеет к доминированию"
        : dominance.normalized <= 40
          ? "стиль тяготеет к подстройке"
          : "ось доминирования выглядит сбалансированной";

  const warmthLabel =
    warmth?.normalized == null
      ? "ось теплоты пока не определена"
      : warmth.normalized >= 60
        ? "в контакте заметна теплота"
        : warmth.normalized <= 40
          ? "в контакте заметна дистанция"
          : "между теплотой и дистанцией нет резкого перекоса";

  return `Сильнее всего выражен сектор ${strongest.shortLabel} (${strongest.scientificLabel.toLowerCase()}); ${dominanceLabel}, ${warmthLabel}.`;
}
