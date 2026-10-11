# deps: @booking/client + зависимости фронтенда — общая база для dev и prod
FROM node:24-alpine AS deps
WORKDIR /app

# @booking/client (file:../spec/client) собирается до npm ci фронтенда
COPY spec/client/package*.json spec/client/
COPY spec/client/tsconfig.json spec/client/
COPY spec/client/src spec/client/src
RUN npm --prefix spec/client ci && npm --prefix spec/client run build

COPY frontend/package*.json frontend/
RUN npm --prefix frontend ci
COPY frontend frontend

# dev: Vite dev-сервер с live reload (compose монтирует ./frontend поверх /app/frontend)
FROM deps AS dev
WORKDIR /app/frontend
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "--port", "5173"]

# build: прод-статика фронтенда (tsc -b && vite build)
FROM deps AS build
RUN npm --prefix frontend run build

# run: nginx раздаёт статику и проксирует /api на backend (frontend/nginx.conf)
FROM nginx:alpine AS run
COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
