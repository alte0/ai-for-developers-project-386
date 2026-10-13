import { Router, type Request, type Response } from 'express'

import type { AdminScheduleInterval } from '../../generated/schema.gen.js'
import { sendError } from '../../lib/api-error.js'
import { getStorage } from '../../lib/storage-access.js'
import { validateRequest } from '../../lib/validate-request.js'

export const replaceScheduleRouter = Router()

replaceScheduleRouter.put(
  '/admin/event-types/:id/schedule',
  validateRequest('Admin_replaceSchedule'),
  (req: Request, res: Response) => {
    const id = Number(req.params.id)
    const storage = getStorage(req)
    if (!storage.getEventType(id)) {
      sendError(res, 404, 'event_type_not_found', 'Тип события не найден')
      return
    }

    const intervals: AdminScheduleInterval[] = req.body
    for (const interval of intervals) {
      if (interval.startMinute >= interval.endMinute) {
        sendError(
          res,
          422,
          'invalid_schedule',
          'Интервал расписания не может начинаться позже конца и переходить через полночь',
        )
        return
      }
    }

    storage.replaceSchedule(
      id,
      intervals.map(({ weekday, startMinute, endMinute }) => ({
        weekday,
        startMinute,
        endMinute,
      })),
    )
    res.status(200).end()
  },
)
