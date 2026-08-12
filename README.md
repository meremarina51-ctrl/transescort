# LuxEscortia

Платформа проверенных анкет: каталог, личный кабинет исполнителя и клиента, модерация, real-time чат, отзывы и интеграция с Telegram.

Монорепозиторий на npm workspaces + Turborepo.

## Стек

- **API** — NestJS 10, Drizzle ORM, PostgreSQL, Socket.IO (real-time чат), JWT-аутентификация
- **Web** — Next.js 15 (App Router), React 19, Tailwind CSS
- **DB** — общий пакет схемы Drizzle (`packages/db`), используется API и миграциями
- **Инфра для разработки** — Postgres, MinIO (S3-совместимое хранилище фото/видео) и Mailhog (перехват писем) в Docker

## Структура репозитория

```
apps/
  api/    — NestJS-бэкенд (порт 3010)
  web/    — Next.js-фронтенд (порт 3011)
packages/
  db/     — схема Drizzle, миграции, типы, общие для API и скриптов
```

Модули API (`apps/api/src/*`): `auth`, `users`, `listings`, `moderation`, `favorites`, `chat`, `reviews`, `telegram`, `storage`, `uploads`, `security`, `health`.

Разделы фронтенда (`apps/web/app/*`): `catalog` (каталог + карточка анкеты), `cabinet` (личный кабинет клиента/исполнителя), `admin` (модерация, пользователи, исполнители), `login`/`register`/`recover`, `legal`.

## Требования

- Node.js ≥ 22, npm ≥ 10
- Docker Desktop (для Postgres/MinIO/Mailhog в разработке)

## Быстрый старт

```bash
# 1. Переменные окружения — один .env в корне, общий для API и web
cp .env.example .env

# 2. Поднять Postgres, MinIO, Mailhog
docker compose -f docker-compose.dev.yml up -d

# 3. Установить зависимости
npm install

# 4. Прогнать миграции БД
npm run db:bootstrap

# 5. (опционально) создать администратора
npm run seed:admin --workspace=@transescort/api

# 6. Запустить API и web вместе
npm run dev:apps
```

После запуска:

- Web — http://localhost:3011
- API — http://localhost:3010
- Swagger-документация API — http://localhost:3010/api/docs
- Почта (Mailhog) — http://localhost:8026
- Консоль MinIO — http://localhost:9001

`npm run dev` (без `:apps`) запускает всё через Turborepo — эквивалентно, но без цветной маркировки логов по процессам.

## Переменные окружения

Один `.env` в корне репозитория читают и API, и web (Next.js поднимается по дереву каталогов в поисках файла). Ключевые переменные из `.env.example`:

| Переменная | Назначение |
| --- | --- |
| `DATABASE_URL` | строка подключения к Postgres (порт `5433` в докере — чтобы не конфликтовать с локальным Postgres) |
| `PORT`, `HOST` | на каком порту/интерфейсе слушает API |
| `JWT_SECRET` | секрет для подписи access/refresh токенов — обязательно сменить в проде |
| `FRONTEND_URL`, `ALLOWED_ORIGINS` | список источников, которым разрешён CORS к API |
| `SMTP_*`, `CONTACT_FORM_TO_EMAIL` | почта верификации и формы обратной связи (в деве — Mailhog) |
| `TELEGRAM_BOT_TOKEN` | токен бота из @BotFather — включает привязку Telegram и relay-чат; пусто — функция выключена |
| `NEXT_PUBLIC_API_URL` | адрес API, который видит браузер. Обязателен для WebSocket-подключений (чат) — Next.js `rewrites()` проксирует только обычные HTTP-запросы, апгрейд до WS через них не проходит |

## Основные npm-скрипты (корень репозитория)

| Команда | Что делает |
| --- | --- |
| `npm run dev:apps` | API + web параллельно, с раздельными цветными логами (`concurrently`) |
| `npm run dev` | то же самое через Turborepo |
| `npm run build` | сборка всех пакетов (`packages/db` → `apps/api` → `apps/web`) |
| `npm run lint` | линт по всем workspace |
| `npm run test` | тесты по всем workspace |
| `npm run db:generate` | сгенерировать новую миграцию Drizzle по изменённой схеме |
| `npm run db:migrate` | применить миграции |
| `npm run db:studio` | Drizzle Studio — GUI для БД |

В `apps/api` отдельно доступны `npm run seed:admin` и `npm run seed:listings --workspace=@transescort/api` для наполнения тестовыми данными.

## Продакшен

Деплой — через PM2 (`npm run deploy:vps`: установка зависимостей, миграции, сборка, `pm2 restart`). Перед первым деплоем на сервере должен быть настроен реверс-прокси (nginx) со следующими обязательными моментами:

- обычный прокси на порт web-процесса (`3011`) для всех путей;
- **отдельный** `location /socket.io/`, проксирующий на порт API (`3010`) с заголовками `Upgrade`/`Connection: upgrade` — без него не работает real-time чат, так как Next.js не умеет проксировать WebSocket-апгрейд через свои `rewrites()`.

## Замечания по разработке

- `apps/api` в dev-режиме запускается через голый `ts-node` без watch/reload — после любого изменения бэкенда процесс нужно перезапускать вручную.
- Схема БД правится в `packages/db/src/schema`, миграция генерируется командой `db:generate`, применяется `db:migrate`; после изменений в `packages/db` нужно пересобрать пакет (`npm run build --workspace=@transescort/db`), чтобы `apps/api` увидел новые типы из `dist`.
