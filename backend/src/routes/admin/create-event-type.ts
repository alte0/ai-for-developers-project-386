import { Router, type Request, type Response } from 'express'

import { config } from '../../config.js'
import type { AdminCreateEventType } from '../../generated/schema.gen.js'
import { sendError } from '../../lib/api-error.js'
import { getStorage } from '../../lib/storage-access.js'
import { validateRequest } from '../../lib/validate-request.js'

export const createEventTypeRouter = Router()

createEventTypeRouter.post(
  '/admin/event-types',
  validateRequest('Admin_createEventType'),
  (req: Request, res: Response) => {
    const body: AdminCreateEventType = req.body
    const name = body.name.trim()
    if (!name) {
      sendError(res, 422, 'invalid_name', 'Название Типа события не может быть пустым')
      return
    }
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
    const created = getStorage(req).createEventType({
      name,
      durationMinutes: body.durationMinutes,
      availabilityMode: body.availabilityMode,
    })
    res.status(201).json(created)
  },
)
