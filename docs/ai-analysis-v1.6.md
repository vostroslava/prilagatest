# AI Analysis v1.6

## Что добавлено

В продукт встроен аккуратный AI-слой поверх уже существующих данных профиля:

- анализ одного профиля
- анализ сравнения двух профилей
- structured JSON-ответы через Gemini API
- local-first сохранение последнего анализа

AI не заменяет scoring и не меняет доменную модель профиля. Он читает уже рассчитанные шкалы, derived scores и реальные ответы.

## Где живёт логика

- Gemini gateway: [lib/ai/gemini.ts](../lib/ai/gemini.ts)
- Prompt builders: [lib/ai/prompts.ts](../lib/ai/prompts.ts)
- Structured validation: [lib/ai/validation.ts](../lib/ai/validation.ts)
- Profile analysis route: [app/api/analysis/profile/route.ts](../app/api/analysis/profile/route.ts)
- Compare analysis route: [app/api/analysis/compare/route.ts](../app/api/analysis/compare/route.ts)
- Local persistence: [lib/storage/analysis-store.ts](../lib/storage/analysis-store.ts)

## Почему ключ не попадает в клиент

Gemini вызывается только на сервере через route handlers.

- браузер отправляет profile document или пару профилей на `/api/analysis/*`
- route handler валидирует payload
- сервер вызывает Gemini с `GEMINI_API_KEY` из env
- клиент получает только структурированный JSON-ответ

Ключ не попадает в client bundle и не хранится в localStorage.

## Формат анализа

### Single profile

- `summary`
- `keyObservations`
- `attentionAreas`
- `interpersonalReading`
- `conflictReading`
- `howToReadWithoutLabels`
- `disclaimer`

### Compare

- `summary`
- `similarities`
- `differences`
- `interactionStrengths`
- `frictionPoints`
- `communicationNotes`
- `disclaimer`

## Как хранится анализ

Сохранение сейчас сделано local-first:

- profile analysis хранится по `profileId`
- compare analysis хранится по deterministic `pairKey`
- сохраняются `generatedAt`, `model`, `source`
- дополнительно сохраняется snapshot `updatedAt`, чтобы отмечать analysis как potentially outdated

Если профиль меняется после генерации, анализ не удаляется, но UI помечает его как потенциально устаревший.

## Demo fixtures

Для demo-ready сценария добавлены два полных профиля:

- `demo-aleksey-orlov`
- `demo-yuliya-kovaleva`

Они строятся не вручную через UI, а детерминированно через scoring pipeline в [lib/demo/profiles.ts](../lib/demo/profiles.ts).
