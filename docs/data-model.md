# Data Model

Главный формат продукта — полный JSON-экспорт профиля.

## Экспортный тип

- `exportType: "self-understanding-profile-v1"`

## Корневые ключи JSON

- `profileMeta`
- `assessmentProgress`
- `rawAnswers`
- `scoring`
- `derivedScores`
- `textualInterpretation`
- `scaleDefinitions`
- `versionInfo`
- `calculationMeta`

## 1. profileMeta

Содержит:

- локальный `id`
- `displayName`
- `about`
- `language`
- `contexts`
- `createdAt`
- `updatedAt`
- `privacyMode`
- `status`

## 2. assessmentProgress

Отдельно по каждому блоку:

- `answered`
- `total`
- `completionRatio`
- `status`
- `lastVisitedPage`
- `startedAt`
- `completedAt`

Это нужно и для UX, и для честного экспорта частично заполненного профиля.

## 3. rawAnswers

Содержит три массива:

- `big-five`
- `ipip-ipc`
- `conflict-profile`

Каждый элемент массива — это полный response object, в котором есть:

- `blockId`
- `itemId`
- `order`
- `originalText`
- `russianText`
- `scaleKey`
- `scientificScale`
- `reverseKeyed`
- `answer`
- `answeredAt`
- `source`

## 4. scoring

Содержит рассчитанные базовые шкалы по каждому блоку:

- `big-five`: 5 базовых пользовательских trait scales
- `ipip-ipc`: 8 октантов
- `conflict-profile`: 8 базовых конфликтных шкал

Каждая запись содержит:

- `key`
- `label`
- `shortLabel`
- `scientificLabel`
- `rawMean`
- `rawSum`
- `normalized`
- `answeredItems`
- `totalItems`
- `band`
- `sourceScale`
- `note`

## 5. derivedScores

Плоский массив дополнительных вычисленных показателей:

- `big-five-trait-spread`
- `dominance-axis`
- `warmth-axis`
- `engagement-vs-withdrawal`
- `reactivity-level`
- `repair-potential`

Каждый объект содержит:

- `key`
- `blockId`
- `label`
- `description`
- `value`
- `normalized`
- `note`

## 6. textualInterpretation

Содержит:

- `shortProfile`
- `detailedProfile`
- `blockSummaries`
- `scaleNarratives`
- `disclaimers`

Это детерминированные тексты, которые уже можно использовать в human-readable export.

## 7. scaleDefinitions

Плоский массив определений шкал, вынесенный в экспорт, чтобы внешний ручной анализ видел структуру без чтения исходного кода.

## 8. versionInfo

Содержит:

- `productVersion`
- `exportVersion`
- `methodologyVersion`
- `contentVersion`
- `conflictModuleVersion`

## 9. calculationMeta

Содержит:

- `calculatedAt`
- `completenessByBlock`
- `notes`

## Импорт

Импорт идёт из того же полного JSON-экспорта.

### Валидируемые поля

- структура exportType
- profileMeta
- assessmentProgress
- rawAnswers
- scoring
- derivedScores
- textualInterpretation
- scaleDefinitions
- versionInfo
- calculationMeta

### Поведение при конфликте локального ID

- если профиль с таким `profileMeta.id` уже есть в локальном IndexedDB, продукт создаёт импортированную копию с новым локальным ID
- в `calculationMeta.notes` добавляется примечание, что это imported copy

Это нужно, чтобы не перезаписывать существующий локальный профиль без явного решения пользователя.
