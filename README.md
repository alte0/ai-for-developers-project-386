# Календарь звонков

[![hexlet-check](https://github.com/alte0/ai-for-developers-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/alte0/ai-for-developers-project-386/actions)
[![ci](https://github.com/alte0/ai-for-developers-project-386/actions/workflows/ci.yml/badge.svg)](https://github.com/alte0/ai-for-developers-project-386/actions)

Разработайте совместно с ИИ сервис для бронирования календаря

Учебный проект Хекслета: https://ru.hexlet.io/programs/ai-for-developers
Как это должно работать: https://files.hexlet.app/a/2ipc5m

## Стек

- Backend: TypeScript, Express (`backend/`, порт 3000, `GET /api/health`)
- Frontend: TypeScript, Vite + React, Tailwind, shadcn/ui (`frontend/`, порт 5173)
- API-контракт: TypeSpec (`spec/`) → OpenAPI (`docs/openapi.yaml`)
- Инфраструктура: Docker, docker-compose

## Установка

<!-- Опишите установку: клонирование, зависимости, переменные окружения -->

```bash
git clone https://github.com/alte0/ai-for-developers-project-386.git
cd ai-for-developers-project-386
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000/api/health → `{"status":"ok"}`

## Использование

<!-- Добавьте примеры запуска и запись asciinema — именно это смотрит работодатель -->

## API-контракт

Контракт описывается в TypeSpec (`spec/`), смысл — в `docs/spec.md` §3. Сгенерированный OpenAPI лежит в `docs/openapi.yaml`; руками его не правят.

```bash
npm --prefix spec install   # однократно
make openapi                # spec/*.tsp → docs/openapi.yaml
make openapi-check          # перегенерация + проверка, что YAML не разошёлся с исходниками
```

---

<details>
<summary>Автоматические тесты Хекслета</summary>

Тесты запускаются на каждый коммит. За запуск отвечает файл `.github/workflows/hexlet-check.yml` — не удаляйте и не переименовывайте ни его, ни репозиторий.

</details>

## О Хекслете

[Хекслет](https://ru.hexlet.io/) — школа программирования: авторские программы обучения с практикой, поддержкой наставников и реальными проектами, которые остаются в резюме. Этот репозиторий — один из таких проектов.
