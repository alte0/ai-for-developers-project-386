import { Router, type Request, type Response } from 'express'

import { sendError } from '../../lib/api-error.js'
import { getStorage } from '../../lib/storage-access.js'
import { validateRequest } from '../../lib/validate-request.js'

export const deleteWindowRouter = Router()

deleteWindowRouter.delete(
  '/admin/windows/:id',
  validateRequest('Admin_deleteWindow'),
  (req: Request, res: Response) => {
    const deleted = getStorage(req).deleteWindow(Number(req.params.id))
    if (!deleted) {
      sendError(res, 404, 'not_found', 'Окно не найдено')
      return
    }
    res.status(204).send()
  },
)
