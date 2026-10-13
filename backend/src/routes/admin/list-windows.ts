import { Router, type Request, type Response } from 'express'

import type { AdminWindow } from '../../generated/schema.gen.js'
import { sendError } from '../../lib/api-error.js'
import { getStorage } from '../../lib/storage-access.js'
import { validateRequest } from '../../lib/validate-request.js'

export const listWindowsRouter = Router()

listWindowsRouter.get(
  '/admin/event-types/:id/windows',
  validateRequest('Admin_listWindows'),
  (req: Request, res: Response) => {
    const id = Number(req.params.id)
    const storage = getStorage(req)
    if (!storage.getEventType(id)) {
      sendError(res, 404, 'event_type_not_found', 'Тип события не найден')
      return
    }
    const windows: AdminWindow[] = storage
      .listWindows(id)
      .map(({ id: windowId, start, end }) => ({ id: windowId, start, end }))
    res.json(windows)
  },
)
