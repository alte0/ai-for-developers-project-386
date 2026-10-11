/**
 * Заготовка маршрута `PUT /api/admin/event-types/{id}/schedule` (operationId: Admin_replaceSchedule).
 *
 * Создана spec/scripts/generate-server-artifacts.mjs; генератор существующие файлы
 * не перезаписывает — дальше правишь сам. Логика — по docs/spec.md §3.2.
 * Вход уже проверен `validateRequest` (схема в generated/contracts.gen.ts).
 */
import { Router, type Request, type Response } from 'express'

import { validateRequest } from '../../lib/validate-request.js'

export const replaceScheduleRouter = Router()

replaceScheduleRouter.put(
  '/admin/event-types/:id/schedule',
  validateRequest('Admin_replaceSchedule'),
  (_req: Request, res: Response) => {
    res.status(501).json({ error: { code: 'not_implemented', message: 'Not implemented' } })
  },
)
