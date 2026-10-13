import type { Express, Request } from 'express'

import type { Storage } from '../storage/types.js'

/**
 * Доступ к хранилищу из обработчиков: слой внедряется в фабрику приложения
 * (`createApp(storage)`), а маршруты читают его через запрос.
 */
export function attachStorage(app: Express, storage: Storage): void {
  app.locals.storage = storage
}

export function getStorage(req: Request): Storage {
  const storage: Storage | undefined = req.app.locals.storage
  if (!storage) throw new Error('хранилище не подключено к приложению')
  return storage
}
