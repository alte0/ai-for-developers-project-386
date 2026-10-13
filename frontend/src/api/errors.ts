/**
 * Ошибка API в конверте `{ "error": { "code", "message" } }` (docs/spec.md §3):
 * UI реагирует на `code`, а показывает пользователю `message`.
 */
export class ApiError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}
