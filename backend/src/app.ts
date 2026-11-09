import path from 'node:path'

import cors from 'cors'
import express, { type ErrorRequestHandler } from 'express'
import { apiRouter } from './generated/routers.gen.js'
import { sendError } from './lib/api-error.js'
import { attachStorage } from './lib/storage-access.js'
import { healthRouter } from './routes/health.js'
import { createSqliteStorage } from './storage/sqlite.js'
import type { Storage } from './storage/types.js'

/**
 * Невалидный JSON от `express.json()` → 400 в конверте контракта, а не
 * HTML-страница дефолтного error-хендлера Express.
 */
const malformedJsonHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (
    typeof err === 'object' &&
    err !== null &&
    'type' in err &&
    err.type === 'entity.parse.failed'
  ) {
    sendError(res, 400, 'invalid_request', 'body: malformed JSON')
    return
  }
  next(err)
}

export interface CreateAppOptions {
  /**
   * Каталог с собранным фронтендом. Задан только в контейнерном образе:
   * API отдаёт статику и SPA-fallback, поэтому один процесс обслуживает
   * и `/api`, и клиентские маршруты (`/`, `/booking`, `/admin`).
   */
  staticDir?: string
}

/**
 * Фабрика приложения: хранилище внедряется снаружи, чтобы тесты подставляли
 * своё (по умолчанию — изолированная in-memory БД).
 */
export function createApp(
  storage: Storage = createSqliteStorage({ path: ':memory:' }),
  options: CreateAppOptions = {},
) {
  const app = express()
  app.use(cors())
  app.use(express.json())
  attachStorage(app, storage)
  app.use('/api', healthRouter)
  app.use('/api', apiRouter)
  app.use(malformedJsonHandler)

  if (options.staticDir) {
    const staticDir = options.staticDir
    app.use(express.static(staticDir))
    // SPA на BrowserRouter: неизвестные не-API GET/HEAD отдают index.html.
    app.use((req, res, next) => {
      const isApi = req.path === '/api' || req.path.startsWith('/api/')
      if (isApi || (req.method !== 'GET' && req.method !== 'HEAD')) {
        next()
        return
      }
      res.sendFile(path.join(staticDir, 'index.html'))
    })
  }

  return app
}
