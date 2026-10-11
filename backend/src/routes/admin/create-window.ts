/**
 * Заготовка маршрута `POST /api/admin/event-types/{id}/windows` (operationId: Admin_createWindow).
 *
 * Создана spec/scripts/generate-server-artifacts.mjs; генератор существующие файлы
 * не перезаписывает — дальше правишь сам. Логика — по docs/spec.md §3.2.
 * Типы: тело запроса → `AdminCreateWindow`, ответ → `AdminWindow`.
 * Вход уже проверен `validateRequest` (схема в generated/contracts.gen.ts).
 */
import { Router, type Request, type Response } from 'express'

import { validateRequest } from '../../lib/validate-request.js'

export const createWindowRouter = Router()

createWindowRouter.post(
  '/admin/event-types/:id/windows',
  validateRequest('Admin_createWindow'),
  (_req: Request, res: Response) => {
    res.status(501).json({ error: { code: 'not_implemented', message: 'Not implemented' } })
  },
)
