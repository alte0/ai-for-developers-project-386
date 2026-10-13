import type { Response } from 'express'

/**
 * Единый конверт ошибки `{ "error": { "code", "message" } }` (docs/spec.md §3).
 * Один хелпер вместо ручной сборки объекта в каждом месте отказа.
 */
export function sendError(res: Response, status: number, code: string, message: string): void {
  res.status(status).json({ error: { code, message } })
}
