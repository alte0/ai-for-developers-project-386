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

/**
 * Фабрика приложения: хранилище внедряется снаружи, чтобы тесты подставляли
 * своё (по умолчанию — изолированная in-memory БД).
 */
export function createApp(storage: Storage = createSqliteStorage({ path: ':memory:' })) {
  const app = express()
  app.use(cors())
  app.use(express.json())
  attachStorage(app, storage)
  app.use('/api', healthRouter)
  app.use('/api', apiRouter)
  app.use(malformedJsonHandler)
  return app
}
