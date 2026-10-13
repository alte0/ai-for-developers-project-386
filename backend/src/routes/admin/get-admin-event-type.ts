import { Router, type Request, type Response } from 'express'

import { sendError } from '../../lib/api-error.js'
import { getStorage } from '../../lib/storage-access.js'
import { validateRequest } from '../../lib/validate-request.js'

export const getAdminEventTypeRouter = Router()

getAdminEventTypeRouter.get(
  '/admin/event-types/:id',
  validateRequest('Admin_getAdminEventType'),
  (req: Request, res: Response) => {
    const eventType = getStorage(req).getEventType(Number(req.params.id))
    if (!eventType) {
      sendError(res, 404, 'event_type_not_found', 'Тип события не найден')
      return
    }
    res.json(eventType)
  },
)
