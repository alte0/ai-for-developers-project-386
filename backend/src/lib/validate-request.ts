/**
 * Рантайм-проверка входов по контракту: ajv-валидаторы компилируются из
 * JSON Schema, сгенерированных в `generated/contracts.gen.ts` (docs/openapi.yaml).
 *
 * Поведение:
 * - path/query проверяются с `coerceTypes` (строка "5" из URL проходит как int);
 *   коэрция применяется только к копии — `req.params`/`req.query` остаются строками,
 *   как их типизирует Express;
 * - тело (`application/json`) проверяется без коэрции, лишние поля отклоняются;
 * - ошибка → `400` в конверте контракта `{ error: { code, message } }`.
 *
 * Бизнес-проверки (порядок 404 → 422 → 409 из spec.md) живут в хендлерах, здесь —
 * только структура запроса.
 */
import Ajv, { type ErrorObject, type ValidateFunction } from 'ajv'
import addFormats from 'ajv-formats'
import type { RequestHandler, Response } from 'express'

import { requestSchemas } from '../generated/contracts.gen.js'

type OperationValidators = {
  params?: ValidateFunction
  query?: ValidateFunction
  body?: ValidateFunction
}

const ajvBody = new Ajv({ allErrors: true, strict: false })
const ajvUrl = new Ajv({ allErrors: true, strict: false, coerceTypes: true })
addFormats(ajvBody)
addFormats(ajvUrl)

const cache = new Map<string, OperationValidators>()

function getValidators(operationId: string): OperationValidators {
  const cached = cache.get(operationId)
  if (cached !== undefined) return cached
  const schemas = requestSchemas[operationId]
  if (!schemas) {
    throw new Error(`validateRequest: неизвестный operationId "${operationId}"`)
  }
  const compiled: OperationValidators = {
    params: schemas.params ? ajvUrl.compile(schemas.params) : undefined,
    query: schemas.query ? ajvUrl.compile(schemas.query) : undefined,
    body: schemas.body ? ajvBody.compile(schemas.body) : undefined,
  }
  cache.set(operationId, compiled)
  return compiled
}

function formatErrors(errors: ErrorObject[] | null | undefined): string {
  if (!errors || errors.length === 0) return 'request is invalid'
  return errors
    .map((error) => `${error.instancePath || '/'} ${error.message ?? 'is invalid'}`)
    .join('; ')
}

function reject(res: Response, section: string, errors: ErrorObject[] | null | undefined): void {
  res.status(400).json({
    error: { code: 'invalid_request', message: `${section}: ${formatErrors(errors)}` },
  })
}

/** Middleware: проверяет path/query/тело операции и пропускает дальше либо отвечает 400. */
export function validateRequest(operationId: string): RequestHandler {
  // Ошибка здесь, а не на первом запросе: неверный operationId — баг разводки маршрутов.
  const validators = getValidators(operationId)
  return (req, res, next) => {
    if (validators.params && !validators.params({ ...req.params })) {
      reject(res, 'params', validators.params.errors)
      return
    }
    if (validators.query && !validators.query({ ...req.query })) {
      reject(res, 'query', validators.query.errors)
      return
    }
    if (validators.body && !validators.body(req.body)) {
      reject(res, 'body', validators.body.errors)
      return
    }
    next()
  }
}
