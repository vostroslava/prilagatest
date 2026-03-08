# Личный профиль v1.5

Hybrid local-first веб-продукт для самопонимания.

В центре остаётся локальный профиль личности:

1. пользователь может работать как гость без регистрации
2. профиль и прогресс по-прежнему живут локально в IndexedDB
3. аккаунт добавляет sync, backup и доступ с нескольких устройств

Продукт не является dating marketplace, соцсетью, matchmaking-сервисом или клиническим инструментом.

## Что работает в v1.5

- создание локального профиля
- прохождение 3 тестовых блоков
- one-question-per-screen test flow
- локальный autosave после каждого ответа
- экран результатов и аналитики
- raw-data / export screen
- импорт JSON-профиля обратно в локальное хранилище
- сравнение двух профилей
- username/password аккаунт
- серверное хранение профилей в Postgres для авторизованных пользователей
- guest-to-account sync flow:
  - оставить локально
  - синхронизировать выбранные профили
  - синхронизировать все профили

## Текущий стек

- Next.js `16.1.6`
- React `19.2.3`
- Tailwind CSS `4`
- shadcn/ui `4`
- IndexedDB через `idb`
- Auth через `next-auth@4`
- Postgres через `postgres` + `drizzle-orm`
- миграции через `drizzle-kit`

## Архитектурная идея v1.5

Приложение не стало cloud-first.

Правильная модель:

- guest mode без регистрации остаётся полноценным
- локальные профили всегда живут на устройстве
- аккаунт добавляет второй слой: серверный backup и sync
- текущая scoring/content/export модель не переписана
- сервер хранит профиль как JSON document, близкий к текущему local schema

### Почему сессии сделаны так

В реальной версии библиотеки, которая сейчас стоит в проекте (`next-auth@4.24.13`), username/password через `Credentials` работает с secure HttpOnly JWT session cookies. Это не localStorage и не самодельные токены в браузере. Для этого MVP это самый короткий и надёжный путь без переписывания всего auth-слоя.

Подробности и tradeoffs зафиксированы в [docs/vercel-migration-v1.5.md](./docs/vercel-migration-v1.5.md).

## Локальный запуск

### 1. Установка

```bash
npm install
```

### 2. Переменные окружения

```bash
cp .env.example .env.local
```

Минимально для guest-only локальной работы:

- приложение запускается и без `DATABASE_URL`
- но auth/sync сценарии без `DATABASE_URL` недоступны

Для полного v1.5 сценария заполните:

- `AUTH_SECRET`
- `DATABASE_URL`
- `NEXTAUTH_URL=http://localhost:3000`

`GEMINI_API_KEY` опционален и относится только к уже существующему экспериментальному server route, а не к core v1.5.

### 3. Поднять схему Postgres

```bash
npm run db:push
```

Сгенерированная migration лежит в:

- [drizzle/0000_lively_angel.sql](./drizzle/0000_lively_angel.sql)

### 4. Запустить dev-сервер

```bash
npm run dev
```

Откройте:

- [http://localhost:3000](http://localhost:3000)

## Основные пользовательские сценарии

### Гость

1. открыть главную
2. создать профиль
3. пройти тесты
4. открыть результаты
5. экспортировать JSON/Markdown/TXT
6. импортировать профиль обратно
7. сравнить два профиля

### Аккаунт

1. открыть `/auth`
2. создать аккаунт или войти
3. вернуться на главную
4. при наличии локальных guest профилей выбрать:
   - оставить локально
   - sync selected
   - sync all
5. после этого профили начинают подгружаться из аккаунта в новой сессии

## Модель данных сервера

Минимальная схема:

- `users`
  - `id`
  - `username`
  - `password_hash`
  - `display_name`
  - `created_at`
  - `updated_at`
- `profiles`
  - `id`
  - `user_id`
  - `profile_doc` JSONB
  - `source`
  - `version`
  - `created_at`
  - `updated_at`

`profile_doc` хранится близко к текущему `FullProfileExport`, чтобы не ломать экспорт/import/scoring и не делать раннюю over-normalization.

## Sync модель

- локальный профиль остаётся source of interaction
- серверный слой используется как backup + multi-device persistence
- при локальном редактировании аккаунтного профиля статус становится `pending-sync`
- серверный merge для MVP: `last-write-wins` по `profileMeta.updatedAt`
- UI показывает:
  - `Только локально`
  - `Синхронизирован`
  - `Ждёт sync`
  - `Ошибка sync`

## Деплой на Vercel

### 1. Создайте Postgres

Подойдёт любой Vercel-compatible Postgres provider, который выдаёт `DATABASE_URL`.

### 2. Добавьте env vars в Vercel

- `AUTH_SECRET`
- `DATABASE_URL`
- `NEXTAUTH_URL`
- `GEMINI_API_KEY` только если хотите сохранить экспериментальный AI route

### 3. Примените схему

Локально или в CI:

```bash
npm run db:push
```

### 4. Deploy

Обычный Next.js deployment без static export.

В v1.5 убраны:

- `output: "export"`
- GitHub Pages `basePath` зависимость
- `generateStaticParams()` заглушки для dynamic profile routes

## Ручной smoke checklist

### Guest

1. открыть `/`
2. создать профиль
3. пройти минимум по одному вопросу в каждом блоке
4. вернуться в результаты
5. открыть raw-data
6. скачать JSON
7. импортировать JSON обратно
8. открыть `/compare`
9. сравнить два локальных профиля

### Auth + sync

1. открыть `/auth`
2. зарегистрировать пользователя
3. выполнить login
4. убедиться, что на главной появился sync block для guest профилей
5. выполнить `sync selected` или `sync all`
6. разлогиниться
7. залогиниться снова
8. убедиться, что серверные профили подгрузились обратно в local store
9. изменить профиль и убедиться, что статус кратко становится `Ждёт sync`, а затем возвращается в `Синхронизирован`

## Проверка кода

```bash
npm run lint
npm run build
```

## Документация

- [docs/test-sources.md](./docs/test-sources.md)
- [docs/scoring-model.md](./docs/scoring-model.md)
- [docs/data-model.md](./docs/data-model.md)
- [docs/manual-analysis-package.md](./docs/manual-analysis-package.md)
- [docs/privacy-model.md](./docs/privacy-model.md)
- [docs/vercel-migration-v1.5.md](./docs/vercel-migration-v1.5.md)
