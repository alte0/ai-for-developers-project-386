import cors from 'cors'
import express, { type ErrorRequestHandler } from 'express'
import { apiRouter } from './generated/routers.gen.js'
import { healthRouter } from './routes/health.js'

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
    res.status(400).json({
      error: { code: 'invalid_request', message: 'body: malformed JSON' },
    })
    return
  }
  next(err)
}

export function createApp() {
  const app = express()
  app.use(cors())
  app.use(express.json())
  app.use('/api', healthRouter)
  app.use('/api', apiRouter)
  app.use(malformedJsonHandler)
  return app
}
