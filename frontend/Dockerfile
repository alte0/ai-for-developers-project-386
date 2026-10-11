FROM node:24-alpine
WORKDIR /app

# @booking/client (file:../spec/client) собирается до npm ci фронтенда
COPY spec/client/package*.json spec/client/
COPY spec/client/tsconfig.json spec/client/
COPY spec/client/src spec/client/src
RUN npm --prefix spec/client ci && npm --prefix spec/client run build

COPY frontend/package*.json frontend/
RUN npm --prefix frontend ci
COPY frontend frontend

WORKDIR /app/frontend
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "--port", "5173"]
