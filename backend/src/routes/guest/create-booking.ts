/**
 * Заготовка маршрута `POST /api/bookings` (operationId: Guest_createBooking).
 *
 * Создана spec/scripts/generate-server-artifacts.mjs; генератор существующие файлы
 * не перезаписывает — дальше правишь сам. Логика — по docs/spec.md §3.1.
 * Типы: тело запроса → `GuestCreateBooking`, ответ → `GuestBookingPublic`.
 * Вход уже проверен `validateRequest` (схема в generated/contracts.gen.ts).
 */
import { Router, type Request, type Response } from 'express'

import { validateRequest } from '../../lib/validate-request.js'

export const createBookingRouter = Router()

createBookingRouter.post(
  '/bookings',
  validateRequest('Guest_createBooking'),
  (_req: Request, res: Response) => {
    res.status(501).json({ error: { code: 'not_implemented', message: 'Not implemented' } })
  },
)
