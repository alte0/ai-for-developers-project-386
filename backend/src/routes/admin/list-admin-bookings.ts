import { Router, type Request, type Response } from 'express'

import type { AdminBookingAdmin } from '../../generated/schema.gen.js'
import { getStorage } from '../../lib/storage-access.js'
import type { BookingRecord } from '../../storage/types.js'
import { validateRequest } from '../../lib/validate-request.js'

export const listAdminBookingsRouter = Router()

function toAdminEntry(booking: BookingRecord): AdminBookingAdmin {
  return {
    id: booking.id,
    eventTypeId: booking.eventTypeId,
    start: booking.start,
    end: booking.end,
    name: booking.name,
    email: booking.email,
    note: booking.note ?? undefined,
    createdAt: booking.createdAt,
  }
}

listAdminBookingsRouter.get(
  '/admin/bookings',
  validateRequest('Admin_listAdminBookings'),
  (req: Request, res: Response) => {
    const fromParam = req.query.from
    const from = typeof fromParam === 'string' ? fromParam : undefined
    res.json(getStorage(req).listBookings(from).map(toAdminEntry))
  },
)
