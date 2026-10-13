import { Router, type Request, type Response } from 'express'

import { config } from '../../config.js'
import type { GuestCreateBooking } from '../../generated/schema.gen.js'
import { sendError } from '../../lib/api-error.js'
import { toIsoUtc } from '../../lib/dates.js'
import { generateSlots } from '../../lib/slots.js'
import { getStorage } from '../../lib/storage-access.js'
import { validateRequest } from '../../lib/validate-request.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const createBookingRouter = Router()

createBookingRouter.post(
  '/bookings',
  validateRequest('Guest_createBooking'),
  (req: Request, res: Response) => {
    const body: GuestCreateBooking = req.body
    const storage = getStorage(req)

    const eventType = storage.getEventType(body.eventTypeId)
    if (!eventType) {
      sendError(res, 404, 'event_type_not_found', 'Тип события не найден')
      return
    }

    const now = Date.now()
    const startMs = Date.parse(body.start)
    if (startMs < now || startMs > now + config.slotHorizonMs) {
      sendError(
        res,
        422,
        'slot_out_of_range',
        'Слот вне горизонта записи: только будущее время в пределах 14 дней',
      )
      return
    }

    const scheduled = generateSlots({
      durationMinutes: eventType.durationMinutes,
      availabilityMode: eventType.availabilityMode,
      schedule: storage.listSchedule(eventType.id),
      windows: storage.listWindows(eventType.id),
      now,
      horizonMs: config.slotHorizonMs,
    })
    const slot = scheduled.find((candidate) => candidate.start === startMs)
    if (!slot) {
      sendError(res, 422, 'slot_not_scheduled', 'Это время не входит в расписание Типа события')
      return
    }

    const name = body.name.trim()
    const note = body.note ?? null
    if (
      !name ||
      !EMAIL_PATTERN.test(body.email) ||
      (note !== null && note.length > config.noteMaxLength)
    ) {
      sendError(res, 422, 'invalid_contact', 'Проверьте имя, email и заметку')
      return
    }

    const result = storage.createBooking({
      eventTypeId: eventType.id,
      start: toIsoUtc(slot.start),
      end: toIsoUtc(slot.end),
      name,
      email: body.email,
      note,
    })
    if (result.status === 'taken') {
      sendError(res, 409, 'slot_taken', 'Слот уже занят, выберите другое время')
      return
    }

    const { id, eventTypeId, start, end } = result.booking
    res.status(201).json({ id, eventTypeId, start, end })
  },
)
