import { Router, type Request, type Response } from 'express'

import { getStorage } from '../../lib/storage-access.js'
import { validateRequest } from '../../lib/validate-request.js'

export const listAdminEventTypesRouter = Router()

listAdminEventTypesRouter.get(
  '/admin/event-types',
  validateRequest('Admin_listAdminEventTypes'),
  (req: Request, res: Response) => {
    res.json(getStorage(req).listEventTypes())
  },
)
