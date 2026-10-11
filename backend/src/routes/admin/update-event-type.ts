/**
 * Заготовка маршрута `PATCH /api/admin/event-types/{id}` (operationId: Admin_updateEventType).
 *
 * Создана spec/scripts/generate-server-artifacts.mjs; генератор существующие файлы
 * не перезаписывает — дальше правишь сам. Логика — по docs/spec.md §3.2.
 * Типы: тело запроса → `AdminUpdateEventType`, ответ → `AdminEventTypeAdmin`.
 * Вход уже проверен `validateRequest` (схема в generated/contracts.gen.ts).
 */
import { Router, type Request, type Response } from 'express'

import { validateRequest } from '../../lib/validate-request.js'

export const updateEventTypeRouter = Router()

updateEventTypeRouter.patch(
  '/admin/event-types/:id',
  validateRequest('Admin_updateEventType'),
  (_req: Request, res: Response) => {
    res.status(501).json({ error: { code: 'not_implemented', message: 'Not implemented' } })
  },
)
