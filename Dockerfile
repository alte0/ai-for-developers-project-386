# Единственный Dockerfile репозитория.
# Dev-стадии (dev-api/dev-web) использует docker-compose, production-стадия
# `runtime` идёт последней — её собирает `docker build .` и запускает проверка.

# --- backend ---
FROM node:24-alpine AS api-deps
WORKDIR /app

COPY backend/package*.json ./
RUN npm ci
COPY backend/tsconfig.json ./
COPY backend/src ./src

FROM api-deps AS api
RUN npm run build

# dev-api: compose монтирует ./backend/src; npm run dev = node --watch --import tsx
FROM api-deps AS dev-api
CMD ["npm", "run", "dev"]

# --- frontend ---
# SDK (@booking/client) собирается до npm ci фронтенда
FROM node:24-alpine AS web-deps
WORKDIR /app

COPY spec/client/package*.json spec/client/
COPY spec/client/tsconfig.json spec/client/
COPY spec/client/src spec/client/src
RUN npm --prefix spec/client ci && npm --prefix spec/client run build

COPY frontend/package*.json frontend/
RUN npm --prefix frontend ci
COPY frontend frontend

FROM web-deps AS web
RUN npm --prefix frontend run build

# dev-web: Vite dev-сервер с live reload; compose монтирует ./frontend
FROM web-deps AS dev-web
WORKDIR /app/frontend
CMD ["npm", "run", "dev", "--", "--host", "--port", "5173"]

# --- production ---
# Один контейнер: Express отдаёт собранный фронтенд и API, слушает PORT.
FROM node:24-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
# PORT не фиксируем в образе: его задаёт .env (dotenv) или окружение деплоя.
# Если переменной нет, backend/src/index.ts использует 3000.
ENV STATIC_DIR=/app/public

COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY --from=api /app/dist ./dist
COPY --from=web /app/frontend/dist ./public

# SQLite (DATABASE_PATH по умолчанию ./data/booking.db)
RUN mkdir -p /app/data

EXPOSE 3000
CMD ["node", "dist/index.js"]
