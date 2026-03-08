import { buildCompareAnalysisPayload, buildProfileAnalysisPayload } from "@/lib/ai/payloads";
import type { FullProfileExport } from "@/types/profile";

const STYLE_GUARDRAILS = [
  "Пиши по-русски.",
  "Опирайся только на переданные данные и не придумывай скрытые факты.",
  "Не ставь диагнозы и не используй медицинские или клинические формулировки.",
  "Не обещай объективную истину о человеке и не вешай ярлыки.",
  "Не считай и не упоминай compatibility score, проценты совместимости или магические выводы.",
  "Формулируй мягко: как наблюдения, склонности, паттерны и зоны внимания.",
].join(" ");

export function buildProfileAnalysisPrompt(profile: FullProfileExport) {
  const payload = buildProfileAnalysisPayload(profile);

  return `${STYLE_GUARDRAILS}

Ты анализируешь готовый профиль самопонимания. Верни JSON по заданной схеме.
Нужны:
- краткое summary на 2-4 предложения;
- 3-5 keyObservations;
- 2-5 attentionAreas;
- 2-5 interpersonalReading;
- 2-5 conflictReading;
- 2-5 howToReadWithoutLabels;
- мягкий disclaimer.

Профиль:
${JSON.stringify(payload, null, 2)}`;
}

export function buildCompareAnalysisPrompt(
  leftProfile: FullProfileExport,
  rightProfile: FullProfileExport,
) {
  const payload = buildCompareAnalysisPayload(leftProfile, rightProfile);

  return `${STYLE_GUARDRAILS}

Ты анализируешь сравнение двух профилей для ручного разбора взаимодействия. Верни JSON по заданной схеме.
Нужны:
- краткое summary на 2-4 предложения;
- 2-5 similarities;
- 2-5 differences;
- 2-5 interactionStrengths;
- 2-5 frictionPoints;
- 2-5 communicationNotes;
- мягкий disclaimer.

Используй имена людей прямо из данных и не называй их "левый" или "правый".

Сравнение:
${JSON.stringify(payload, null, 2)}`;
}
