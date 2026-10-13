import { Router, type Request, type Response } from 'express'

import { config } from '../../config.js'
import type { AdminUpdateEventType } from '../../generated/schema.gen.js'
import { sendError } from '../../lib/api-error.js'
import { getStorage } from '../../lib/storage-access.js'
import type { EventTypePatch } from '../../storage/types.js'
import { validateRequest } from '../../lib/validate-request.js'

export const updateEventTypeRouter = Router()

updateEventTypeRouter.patch(
  '/admin/event-types/:id',
  validateRequest('Admin_updateEventType'),
  (req: Request, res: Response) => {
    const body: AdminUpdateEventType = req.body
    const patch: EventTypePatch = {}

    if (body.name !== undefined) {
      const name = body.name.trim()
      if (!name) {
        sendError(res, 422, 'invalid_name', 'Название Типа события не может быть пустым')
        return
      }
      patch.name = name
    }

    if (body.durationMinutes !== undefined) {
      const { min, max } = config.eventDurationMinutes
      if (body.durationMinutes < min || body.durationMinutes > max) {
        sendError(
          res,
          422,
          'invalid_duration',
          `Длительность Типа события — от ${min} до ${max} минут`,
        )
        return
      }
      patch.durationMinutes = body.durationMinutes
    }

    const updated = getStorage(req).updateEventType(Number(req.params.id), patch)
    if (!updated) {
      sendError(res, 404, 'event_type_not_found', 'Тип события не найден')
      return
    }
    res.json(updated)
  },
)
