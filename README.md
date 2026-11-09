# Календарь звонков

[![hexlet-check](https://github.com/alte0/ai-for-developers-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/alte0/ai-for-developers-project-386/actions)
[![ci](https://github.com/alte0/ai-for-developers-project-386/actions/workflows/ci.yml/badge.svg)](https://github.com/alte0/ai-for-developers-project-386/actions)

Разработайте совместно с ИИ сервис для бронирования календаря

Учебный проект Хекслета: https://ru.hexlet.io/programs/ai-for-developers
Как это должно работать: https://files.hexlet.app/a/2ipc5m

## Стек

- Backend: TypeScript, Express (`backend/`, порт из `PORT` — по умолчанию 3000, `GET /api/health`)
- Frontend: TypeScript, Vite + React, Tailwind, shadcn/ui (`frontend/`, порт 5173)
- API-контракт: TypeSpec (`spec/`) → OpenAPI (`docs/openapi.yaml`)
- Инфраструктура: Docker, docker-compose

## Установка

<!-- Опишите установку: клонирование, зависимости, переменные окружения -->

```bash
git clone https://github.com/alte0/ai-for-developers-project-386.git
cd ai-for-developers-project-386
cp .env.example .env   # PORT=3000
make up                # dev: api + web (live reload)
```

- Dev: frontend http://localhost:5173, backend http://localhost:3000/api/health → `{"status":"ok"}` (порт берётся из `PORT` в `.env`, по умолчанию 3000)
- Остановка: `make down`

Dev-стек заточен под разработку: исходники `frontend/` и `backend/src` смонтированы в контейнеры, правки подхватываются на лету (Vite HMR, `node --watch`) — пересборка (`make up`) нужна только после смены зависимостей или Dockerfile, а также после `make openapi` (контейнеру web нужен свежий образ SDK). Оба dev-сервиса собираются из единственного корневого `Dockerfile` (стадии `dev-api`/`dev-web`).

### Один контейнер (деплой)

Корневой `Dockerfile` собирает фронтенд и API в один образ: Express отдаёт статику и SPA-маршруты, поэтому приложение стартует само и слушает порт из переменной `PORT`. Порт берётся из `.env` (или из окружения деплоя), а если переменной нет — используется 3000. Эту же стадию (`runtime`) собирает `docker build .` в автоматической проверке.

```bash
make up-app      # сборка + запуск одного контейнера (PORT из .env)
make health-app  # /api/health и /
make down-app    # остановка
```

Или вручную:

```bash
docker build -t booking-app .
docker run --rm --env-file .env -p 3000:3000 booking-app
```

`--env-file` передаёт переменные из `.env` в окружение контейнера. Второй вариант — смонтировать файл, `dotenv` прочитает его из `/app/.env`:

```bash
docker run --rm -v "$PWD/.env:/app/.env:ro" -p 3000:3000 booking-app
```

Если меняете `PORT` в `.env`, не забудьте про публикацию того же порта в `-p` (в `make up-app` порт подставляется автоматически). Сам `.env` в образ не попадает (исключён в `.dockerignore`).

- Фронтенд: http://localhost:3000/
- API: http://localhost:3000/api/health → `{"status":"ok"}`

### Render

Приложение опубликовано на Render как Docker web service:

- URL: https://booking-calendar-386.onrender.com
- Dashboard: https://dashboard.render.com/web/srv-dbol5rhsrm7s73caugrg
- Ветка `main`, план Free, регион Frankfurt.
- Сервис подключён к публичному Git-URL, поэтому автодеплой по push не срабатывает: после изменений запускайте Manual Deploy в Dashboard или `trigger_deploy` через Render MCP.

Render сам задаёт переменную `PORT` (в текущем деплое — 10000) и маршрутизирует трафик на неё. Приложение читает `process.env.PORT` и слушает все интерфейсы, поэтому `PORT` в настройках сервиса вручную не фиксируется.

```bash
curl https://booking-calendar-386.onrender.com/api/health
# {"status":"ok"}
```

Особенности Free-плана: сервис засыпает при простое (первый запрос после паузы может занять до минуты), а файловая система эфемерна — SQLite-база сбрасывается при редеплое/перезапуске. Для сохранения данных нужен платный план с persistent disk или внешняя БД.

## Использование

<!-- Добавьте примеры запуска и запись asciinema — именно это смотрит работодатель -->

## API-контракт

Контракт описывается в TypeSpec (`spec/`), смысл — в `docs/spec.md` §3. Из исходников генерируются артефакты (руками не правятся):

- `docs/openapi.yaml` — OpenAPI-документ;
- `spec/client/` — TypeScript-SDK (`@booking/client`), фронтенд подключает его через `file:`-зависимость и вызывает через обёртку `frontend/src/api/client.ts`;
- `backend/src/generated/` — типы контракта, JSON Schemas для ajv и роутер заготовок; из них же `make openapi` создаёт (однократно) заготовки маршрутов `backend/src/routes/{guest,admin}/*.ts` — дальше их правит разработчик, генератор существующие файлы не перезаписывает.

```bash
npm --prefix spec install       # однократно
make openapi                    # вся цепочка одной командой: spec/*.tsp → openapi.yaml + SDK + серверные артефакты backend
make openapi-check              # перегенерация + проверка, что git не разошёлся
```

Та же цепочка объявлена npm-скриптами в `spec/package.json` — пошагово её можно повторить через `npm --prefix spec run gen:openapi` (OpenAPI), `npm --prefix spec run gen:sdk` (SDK), `npm --prefix spec run gen:server` (серверные артефакты); `npm --prefix spec run gen` — зонтик, то же самое, что `make openapi`.

После `make openapi` SDK нужно пересобрать в фронтенде — `npm --prefix frontend install` подхватит обновлённый `dist/` симлинком автоматически (сборка `dist/` уже входит в `make openapi`).

## MCP (Render) для OpenCode

`opencode.json` подключает Render MCP. Ключ читается из `.secrets/render-api-key` и в git не попадает (`.secrets/` в `.gitignore`).

```bash
make mcp-secret     # запросит ключ без эха, создаст .secrets/render-api-key (chmod 600)
make mcp-check      # ✓ render connected
```

Ключ: Render Dashboard → Account Settings → API Keys.

Если файла нет, OpenCode не загрузит конфиг (`bad file reference`) — сначала выполните `make mcp-secret`. OpenCode не читает `.env`, поэтому переменные окружения проекта тут не используются.

> ⚠️ Инструменты Render могут менять env-переменные сервисов и запускать деплои — деструктивны.

---

<details>
<summary>Автоматические тесты Хекслета</summary>

Тесты запускаются на каждый коммит. За запуск отвечает файл `.github/workflows/hexlet-check.yml` — не удаляйте и не переименовывайте ни его, ни репозиторий.

</details>

## О Хекслете

[Хекслет](https://ru.hexlet.io/) — школа программирования: авторские программы обучения с практикой, поддержкой наставников и реальными проектами, которые остаются в резюме. Этот репозиторий — один из таких проектов.
