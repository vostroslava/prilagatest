# Vercel Migration v1.5

## Что было в репозитории до миграции

До v1.5 проект уже был сильным local-first приложением:

- App Router
- client-side profile flow
- IndexedDB storage
- scoring/content/export/compare уже были реализованы
- dynamic profile routes уже существовали

Но в конфиге и страницах оставались признаки раннего static-export режима:

- `output: "export"` через env
- `basePath` логика под GitHub Pages
- `generateStaticParams()` заглушки для dynamic profile routes

Это не подходило для auth + server persistence.

## Что изменено в v1.5

### 1. Deployment model

Проект переведён на обычный Next.js runtime для Vercel:

- убран static export режим
- убрана зависимость от `basePath` для GitHub Pages
- dynamic routes для профилей стали normal runtime routes
- добавлены route handlers для auth и server profile sync

### 2. Auth

Выбран `next-auth@4` с `Credentials` provider.

Почему именно так:

- это минимальный App Router-compatible вариант внутри текущего стека
- не требуется тащить внешний auth SaaS
- secure HttpOnly cookie sessions работают без localStorage-токенов
- клиент и сервер получают устойчивую auth модель без переписывания приложения под cloud-first

### 3. Важный tradeoff по session strategy

Официальное ограничение Credentials-провайдера в текущем Auth.js/NextAuth направлении: для username/password это практически ведёт к JWT session strategy.

Для v1.5 принято прагматичное решение:

- secure signed HttpOnly cookie session
- Postgres хранит пользователей и profile documents
- local-first поведение приложения не меняется

Это сознательный MVP tradeoff ради минимального migration risk.

### 4. Database model

Схема предельно простая:

- `users`
- `profiles`

Причина:

- текущая модель профиля уже существует и уже работает
- экспорт/import/scoring завязаны на document shape
- ранняя нормализация на десятки таблиц только увеличила бы migration risk

Поэтому `profiles.profile_doc` хранится как JSONB-документ, близкий к текущему `FullProfileExport`.

## Hybrid local-first model

Правильное поведение v1.5:

- guest mode создаёт профили только локально
- авторизованный пользователь продолжает работать с локальной копией
- сервер добавляется как слой backup/sync
- при входе серверные профили подтягиваются обратно в local store

## Sync strategy

### Local state

В `StoredProfile` добавлен `syncMeta`:

- `status`
- `ownerUserId`
- `serverUpdatedAt`
- `lastSyncedAt`
- `lastSyncError`
- `localDecision`

Эта метаинформация не входит в exported profile document.

### Server merge

Используется `last-write-wins` по `profileMeta.updatedAt`.

Это достаточно для MVP, потому что:

- профиль хранится как document
- редактирование идёт обычно с одного активного клиента
- сложный CRDT/field-level merge здесь не нужен

### Guest-to-account sync

После входа, если в браузере уже есть guest profiles, приложение явно предлагает:

- оставить локально
- синхронизировать выбранные
- синхронизировать все

Это важно для сохранения local-first принципа.

## Что не менялось специально

Чтобы не разломать продукт:

- scoring logic не переписывалась
- content/tests не менялись
- export/import модель сохранена
- compare flow сохранён
- UI не превращался в auth dashboard

## Основные новые файлы

- [auth.ts](../auth.ts)
- [app/api/auth/[...nextauth]/route.ts](../app/api/auth/[...nextauth]/route.ts)
- [app/api/auth/register/route.ts](../app/api/auth/register/route.ts)
- [app/api/profiles/route.ts](../app/api/profiles/route.ts)
- [lib/db/schema.ts](../lib/db/schema.ts)
- [lib/db/client.ts](../lib/db/client.ts)
- [lib/server/users.ts](../lib/server/users.ts)
- [lib/server/profile-store.ts](../lib/server/profile-store.ts)
- [lib/storage/profile-document.ts](../lib/storage/profile-document.ts)
- [components/auth/auth-panel.tsx](../components/auth/auth-panel.tsx)

## Что ещё можно улучшить позже

- dedicated sync settings screen вместо home-only sync panel
- selective per-profile server delete
- audit trail по sync операциям
- stronger server-side validation around profile version migrations
- optional AI analysis layer поверх уже существующей auth/profile базы
