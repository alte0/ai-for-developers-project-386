import { Router, type Request, type Response } from 'express'

import type { GuestEventTypeGuest } from '../../generated/schema.gen.js'
import { getStorage } from '../../lib/storage-access.js'
import { validateRequest } from '../../lib/validate-request.js'

export const listEventTypesRouter = Router()

listEventTypesRouter.get(
  '/event-types',
  validateRequest('Guest_listEventTypes'),
  (req: Request, res: Response) => {
    const guestProjection: GuestEventTypeGuest[] = getStorage(req)
      .listEventTypes()
      .map(({ id, name, durationMinutes }) => ({ id, name, durationMinutes }))
    res.json(guestProjection)
  },
)
