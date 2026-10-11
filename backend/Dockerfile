FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:24-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]

# Dev-образ для docker-compose: полные зависимости (tsx-лоадер) + исходники;
# compose монтирует ./backend/src поверх /app/src, npm run dev следит за
# правками через node --watch (tsx watch после первого рестарта теряет watcher).
FROM build AS dev
EXPOSE 3000
CMD ["npm", "run", "dev"]
