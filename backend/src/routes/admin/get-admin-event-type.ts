/**
 * Заготовка маршрута `GET /api/admin/event-types/{id}` (operationId: Admin_getAdminEventType).
 *
 * Создана spec/scripts/generate-server-artifacts.mjs; генератор существующие файлы
 * не перезаписывает — дальше правишь сам. Логика — по docs/spec.md §3.2.
 * Типы: ответ → `AdminEventTypeAdmin`.
 * Вход уже проверен `validateRequest` (схема в generated/contracts.gen.ts).
 */
import { Router, type Request, type Response } from 'express'

import { validateRequest } from '../../lib/validate-request.js'

export const getAdminEventTypeRouter = Router()

getAdminEventTypeRouter.get(
  '/admin/event-types/:id',
  validateRequest('Admin_getAdminEventType'),
  (_req: Request, res: Response) => {
    res.status(501).json({ error: { code: 'not_implemented', message: 'Not implemented' } })
  },
)
