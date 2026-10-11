/**
 * Заготовка маршрута `GET /api/slots` (operationId: Guest_listSlots).
 *
 * Создана spec/scripts/generate-server-artifacts.mjs; генератор существующие файлы
 * не перезаписывает — дальше правишь сам. Логика — по docs/spec.md §3.1.
 * Вход уже проверен `validateRequest` (схема в generated/contracts.gen.ts).
 */
import { Router, type Request, type Response } from 'express'

import { validateRequest } from '../../lib/validate-request.js'

export const listSlotsRouter = Router()

listSlotsRouter.get(
  '/slots',
  validateRequest('Guest_listSlots'),
  (_req: Request, res: Response) => {
    res.status(501).json({ error: { code: 'not_implemented', message: 'Not implemented' } })
  },
)
