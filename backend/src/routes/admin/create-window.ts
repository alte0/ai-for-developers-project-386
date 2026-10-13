import { Router, type Request, type Response } from 'express'

import type { AdminCreateWindow } from '../../generated/schema.gen.js'
import { sendError } from '../../lib/api-error.js'
import { isValidIsoUtc, toIsoUtc } from '../../lib/dates.js'
import { getStorage } from '../../lib/storage-access.js'
import { validateRequest } from '../../lib/validate-request.js'

export const createWindowRouter = Router()

createWindowRouter.post(
  '/admin/event-types/:id/windows',
  validateRequest('Admin_createWindow'),
  (req: Request, res: Response) => {
    const id = Number(req.params.id)
    const storage = getStorage(req)
    if (!storage.getEventType(id)) {
      sendError(res, 404, 'event_type_not_found', 'Тип события не найден')
      return
    }

    const body: AdminCreateWindow = req.body
    const startMs = Date.parse(body.start)
    const endMs = Date.parse(body.end)
    if (!isValidIsoUtc(body.start) || !isValidIsoUtc(body.end) || startMs >= endMs) {
      sendError(res, 422, 'invalid_window', 'Начало окна должно быть раньше его конца')
      return
    }
    if (startMs < Date.now()) {
      sendError(res, 422, 'invalid_window', 'Окно доступности можно создать только в будущем')
      return
    }

    const window = storage.createWindow(id, toIsoUtc(startMs), toIsoUtc(endMs))
    res.status(201).json({ id: window.id, start: window.start, end: window.end })
  },
)
