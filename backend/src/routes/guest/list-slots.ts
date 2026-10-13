import { Router, type Request, type Response } from 'express'

import { config } from '../../config.js'
import type { GuestSlot } from '../../generated/schema.gen.js'
import { sendError } from '../../lib/api-error.js'
import { toIsoUtc } from '../../lib/dates.js'
import { generateSlots } from '../../lib/slots.js'
import { getStorage } from '../../lib/storage-access.js'
import { validateRequest } from '../../lib/validate-request.js'

export const listSlotsRouter = Router()

listSlotsRouter.get('/slots', validateRequest('Guest_listSlots'), (req: Request, res: Response) => {
  const eventTypeId = Number(req.query.eventTypeId)
  const storage = getStorage(req)
  const eventType = storage.getEventType(eventTypeId)
  if (!eventType) {
    sendError(res, 404, 'event_type_not_found', 'Тип события не найден')
    return
  }

  const slots = generateSlots({
    durationMinutes: eventType.durationMinutes,
    availabilityMode: eventType.availabilityMode,
    schedule: storage.listSchedule(eventTypeId),
    windows: storage.listWindows(eventTypeId),
    bookings: storage.listBookings(),
    now: Date.now(),
    horizonMs: config.slotHorizonMs,
  })

  const response: GuestSlot[] = slots.map((slot) => ({
    start: toIsoUtc(slot.start),
    end: toIsoUtc(slot.end),
  }))
  res.json(response)
})
