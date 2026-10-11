/**
 * Заготовка маршрута `GET /api/admin/event-types` (operationId: Admin_listAdminEventTypes).
 *
 * Создана spec/scripts/generate-server-artifacts.mjs; генератор существующие файлы
 * не перезаписывает — дальше правишь сам. Логика — по docs/spec.md §3.2.
 * Вход уже проверен `validateRequest` (схема в generated/contracts.gen.ts).
 */
import { Router, type Request, type Response } from 'express'

import { validateRequest } from '../../lib/validate-request.js'

export const listAdminEventTypesRouter = Router()

listAdminEventTypesRouter.get(
  '/admin/event-types',
  validateRequest('Admin_listAdminEventTypes'),
  (_req: Request, res: Response) => {
    res.status(501).json({ error: { code: 'not_implemented', message: 'Not implemented' } })
  },
)
