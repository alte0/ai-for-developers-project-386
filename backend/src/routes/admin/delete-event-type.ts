import { Router, type Request, type Response } from 'express'

import { sendError } from '../../lib/api-error.js'
import { getStorage } from '../../lib/storage-access.js'
import { validateRequest } from '../../lib/validate-request.js'

export const deleteEventTypeRouter = Router()

deleteEventTypeRouter.delete(
  '/admin/event-types/:id',
  validateRequest('Admin_deleteEventType'),
  (req: Request, res: Response) => {
    const result = getStorage(req).deleteEventType(Number(req.params.id))
    if (result === 'not_found') {
      sendError(res, 404, 'event_type_not_found', 'Тип события не найден')
      return
    }
    if (result === 'has_bookings') {
      sendError(
        res,
        409,
        'event_type_has_bookings',
        'Нельзя удалить Тип события: на него есть Записи',
      )
      return
    }
    res.status(204).send()
  },
)
