import { Router, type Request, type Response } from 'express'

import { sendError } from '../../lib/api-error.js'
import { getStorage } from '../../lib/storage-access.js'
import { validateRequest } from '../../lib/validate-request.js'

export const deleteBookingRouter = Router()

deleteBookingRouter.delete(
  '/admin/bookings/:id',
  validateRequest('Admin_deleteBooking'),
  (req: Request, res: Response) => {
    const deleted = getStorage(req).deleteBooking(Number(req.params.id))
    if (!deleted) {
      sendError(res, 404, 'not_found', 'Запись не найдена')
      return
    }
    res.status(204).send()
  },
)
