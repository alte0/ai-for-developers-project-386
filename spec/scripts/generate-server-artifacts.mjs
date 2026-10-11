/**
 * Генерирует серверные артефакты backend из `docs/openapi.yaml`:
 *
 * - `backend/src/generated/schema.gen.d.ts` — типы контракта (openapi-typescript);
 * - `backend/src/generated/contracts.gen.ts` — JSON Schema входов каждой операции
 *   (path/query/тело) для рантайм-валидации через ajv;
 * - `backend/src/generated/routers.gen.ts` — `apiRouter`, собирающий заготовки маршрутов;
 * - `backend/src/routes/<tag>/<operation>.ts` — заготовки маршрутов, scaffold-once:
 *   файл создаётся, только если его ещё нет, и дальше правится руками.
 *
 * Запускается из `make openapi` после `tsp compile`. Руками артефакты из
 * `backend/src/generated` не править; заготовки в `backend/src/routes/{guest,admin}`
 * — владение разработчика, генератор их не перезаписывает.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { format, resolveConfig } from 'prettier'
import { parse } from 'yaml'

const SPEC_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ROOT = path.resolve(SPEC_ROOT, '..')
const OPENAPI_PATH = path.join(ROOT, 'docs', 'openapi.yaml')
const GENERATED_DIR = path.join(ROOT, 'backend', 'src', 'generated')
const ROUTES_DIR = path.join(ROOT, 'backend', 'src', 'routes')

/** HTTP-методы, которые умеет наш контракт (порядок фиксирован для детерминизма). */
const METHODS = ['get', 'put', 'post', 'delete', 'patch']

/**
 * Операции, для которых заготовка не нужна: уже реализованы руками
 * (`GET /api/health` живёт в `backend/src/routes/health.ts`).
 */
const SKIP_SCAFFOLD = new Set(['Service_getHealth'])

/** Тег → раздел docs/spec.md, на который ссылается TODO в заготовке. */
const SPEC_SECTION = { guest: '§3.1', admin: '§3.2', service: '§3' }

function fail(message) {
  throw new Error(`generate-server-artifacts: ${message}`)
}

/** Разворачивает внутренние `$ref` (`#/components/schemas/...`) в самодостаточную схему. */
function resolveRef(root, ref) {
  if (!ref.startsWith('#/')) fail(`внешние $ref не поддерживаются: ${ref}`)
  let node = root
  for (const rawSegment of ref.slice(2).split('/')) {
    const segment = rawSegment.replace(/~1/g, '/').replace(/~0/g, '~')
    if (node === undefined || node === null || typeof node !== 'object') fail(`битый $ref: ${ref}`)
    node = node[segment]
  }
  if (node === undefined) fail(`не найден $ref: ${ref}`)
  return node
}

function resolveSchema(node, root, seen) {
  if (Array.isArray(node)) return node.map((item) => resolveSchema(item, root, seen))
  if (node === null || typeof node !== 'object') return node
  if (typeof node.$ref === 'string') {
    const ref = node.$ref
    if (seen.has(ref)) fail(`циклический $ref: ${ref}`)
    return resolveSchema(resolveRef(root, ref), root, new Set([...seen, ref]))
  }
  const out = {}
  for (const [key, value] of Object.entries(node)) out[key] = resolveSchema(value, root, seen)
  return out
}

/** JSON Schema объекта-контейнера для параметров указанной локации (`path` | `query`). */
function parametersSchema(operation, location) {
  const properties = {}
  const required = []
  for (const parameter of operation.parameters ?? []) {
    if (parameter.in !== location) continue
    if (!parameter.schema) fail(`параметр "${parameter.name}" без schema`)
    properties[parameter.name] = resolveSchema(parameter.schema, document, new Set())
    if (parameter.required) required.push(parameter.name)
  }
  if (Object.keys(properties).length === 0) return undefined
  const schema = { type: 'object', additionalProperties: false, properties }
  if (required.length > 0) schema.required = required
  return schema
}

function bodySchema(operation) {
  const schema = operation.requestBody?.content?.['application/json']?.schema
  if (!schema) return undefined
  const resolved = resolveSchema(schema, document, new Set())
  // Валидация не доверяет клиенту: лишние поля в объектных телах отклоняем.
  if (resolved.type === 'object') return { ...resolved, additionalProperties: false }
  return resolved
}

/** Имя корневого типа из `schema.gen.d.ts` для внутреннего `$ref` (точки убираются). */
function rootTypeName(schema) {
  if (
    schema &&
    typeof schema.$ref === 'string' &&
    schema.$ref.startsWith('#/components/schemas/')
  ) {
    return schema.$ref.slice('#/components/schemas/'.length).replace(/\./g, '')
  }
  return undefined
}

function successResponseType(operation) {
  for (const status of ['200', '201', '202']) {
    const schema = operation.responses?.[status]?.content?.['application/json']?.schema
    if (schema) return rootTypeName(schema)
  }
  return undefined
}

const camel = (operationId) => operationId.replace(/^[A-Za-z]+_/, '')
const kebab = (name) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
const exportName = (operationId) => `${camel(operationId)}Router`

/** Путь вида `/api/admin/bookings/{id}` → Express-путь `/admin/bookings/:id`. */
function expressPath(openapiPath) {
  if (!openapiPath.startsWith('/api/')) fail(`путь вне /api: ${openapiPath}`)
  return openapiPath.slice('/api'.length).replace(/\{([^}]+)\}/g, ':$1')
}

const document = parse(readFileSync(OPENAPI_PATH, 'utf8'))

const operations = []
for (const [openapiPath, item] of Object.entries(document.paths ?? {})) {
  for (const method of METHODS) {
    const operation = item[method]
    if (!operation) continue
    if (!operation.operationId) fail(`у ${method.toUpperCase()} ${openapiPath} нет operationId`)
    const tag = operation.tags?.[0]
    if (!tag) fail(`у ${operation.operationId} нет тега`)
    operations.push({ openapiPath, method, tag, operation })
  }
}
if (operations.length === 0) fail('в docs/openapi.yaml не найдено операций')
operations.sort((a, b) => a.operation.operationId.localeCompare(b.operation.operationId))

const exportsSeen = new Map()
for (const op of operations) {
  const name = exportName(op.operation.operationId)
  const previous = exportsSeen.get(name)
  if (previous) fail(`коллизия экспортов "${name}": ${previous} и ${op.operation.operationId}`)
  exportsSeen.set(name, op.operation.operationId)
}

mkdirSync(GENERATED_DIR, { recursive: true })

// 1. schema.gen.d.ts — типы контракта.
const schemaOut = path.join(GENERATED_DIR, 'schema.gen.d.ts')
const cli = path.join(SPEC_ROOT, 'node_modules', '.bin', 'openapi-typescript')
if (!existsSync(cli)) fail('openapi-typescript не установлен: запусти `npm --prefix spec install`')
const compiled = spawnSync(
  cli,
  [OPENAPI_PATH, '-o', schemaOut, '--root-types', '--root-types-no-schema-prefix', '--alphabetize'],
  { encoding: 'utf8' },
)
if (compiled.status !== 0) fail(`openapi-typescript упал:\n${compiled.stderr || compiled.stdout}`)

// 2. contracts.gen.ts — JSON Schema входов для ajv.
const requests = {}
for (const { operation } of operations) {
  const entry = {}
  const params = parametersSchema(operation, 'path')
  const query = parametersSchema(operation, 'query')
  const body = bodySchema(operation)
  if (params) entry.params = params
  if (query) entry.query = query
  if (body) entry.body = body
  requests[operation.operationId] = entry
}

const contractsHeader = `/**
 * Generated by spec/scripts/generate-server-artifacts.mjs из docs/openapi.yaml.
 * Не править руками: 'make openapi' пересобирает файл. Схемы самодостаточные
 * ($ref развернуты), additionalProperties: false — клиенту не доверяем.
 */
`

const contractsBody = `export interface RequestSchemas {
  /** JSON Schema path-параметров операции. */
  params?: Record<string, unknown>
  /** JSON Schema query-параметров операции. */
  query?: Record<string, unknown>
  /** JSON Schema тела запроса (application/json). */
  body?: Record<string, unknown>
}

export const requestSchemas: Readonly<Record<string, RequestSchemas>> = ${JSON.stringify(requests, null, 2)}
`
const contractsPath = path.join(GENERATED_DIR, 'contracts.gen.ts')
writeFileSync(contractsPath, contractsHeader + contractsBody)

// 3. routers.gen.ts — роутер, собирающий заготовки маршрутов.
const scaffolded = operations.filter(({ operation }) => !SKIP_SCAFFOLD.has(operation.operationId))
const routerImports = scaffolded
  .map(({ operation, tag }) => {
    const file = `${tag}/${kebab(camel(operation.operationId))}.js`
    return `import { ${exportName(operation.operationId)} as ${tag}${camel(operation.operationId).charAt(0).toUpperCase()}${camel(operation.operationId).slice(1)}Router } from '../routes/${file}'`
  })
  .join('\n')
const routerUses = scaffolded
  .map(({ operation, tag }) => {
    const alias = `${tag}${camel(operation.operationId).charAt(0).toUpperCase()}${camel(operation.operationId).slice(1)}Router`
    return `apiRouter.use(${alias})`
  })
  .join('\n')

const routersHeader = `/**
 * Generated by spec/scripts/generate-server-artifacts.mjs из docs/openapi.yaml.
 * Не править руками: 'make openapi' пересобирает файл. Монтируется в app.ts на '/api'.
 */
`
const routersBody = `import { Router } from 'express'

${routerImports}

export const apiRouter = Router()

${routerUses}
`
const routersPath = path.join(GENERATED_DIR, 'routers.gen.ts')
writeFileSync(routersPath, routersHeader + routersBody)

// 4. Заготовки маршрутов (scaffold-once).
let created = 0
let skipped = 0
const createdFiles = []
for (const { openapiPath, method, tag, operation } of operations) {
  if (SKIP_SCAFFOLD.has(operation.operationId)) {
    skipped += 1
    continue
  }
  const target = path.join(ROUTES_DIR, tag, `${kebab(camel(operation.operationId))}.ts`)
  if (existsSync(target)) {
    skipped += 1
    continue
  }
  mkdirSync(path.dirname(target), { recursive: true })
  const section = SPEC_SECTION[tag] ?? '§3'
  const requestType = rootTypeName(operation.requestBody?.content?.['application/json']?.schema)
  const responseType = successResponseType(operation)
  const typeHints = []
  if (requestType) typeHints.push(`тело запроса → \`${requestType}\``)
  if (responseType) typeHints.push(`ответ → \`${responseType}\``)
  const hintLine = typeHints.length > 0 ? ` * Типы: ${typeHints.join(', ')}.\n` : ''
  const stub = `/**
 * Заготовка маршрута \`${method.toUpperCase()} ${openapiPath}\` (operationId: ${operation.operationId}).
 *
 * Создана spec/scripts/generate-server-artifacts.mjs; генератор существующие файлы
 * не перезаписывает — дальше правишь сам. Логика — по docs/spec.md ${section}.
${hintLine} * Вход уже проверен \`validateRequest\` (схема в generated/contracts.gen.ts).
 */
import { Router, type Request, type Response } from 'express'

import { validateRequest } from '../../lib/validate-request.js'

export const ${exportName(operation.operationId)} = Router()

${exportName(operation.operationId)}.${method}(
  '${expressPath(openapiPath)}',
  validateRequest('${operation.operationId}'),
  (_req: Request, res: Response) => {
    res.status(501).json({ error: { code: 'not_implemented', message: 'Not implemented' } })
  },
)
`
  writeFileSync(target, stub)
  createdFiles.push(target)
  created += 1
}

// 5. Prettier — чтобы format-check в backend был доволен (только созданные файлы:
// чужие заготовки генератор не трогает, включая их переформатирование).
for (const file of [contractsPath, routersPath, ...createdFiles]) {
  const source = readFileSync(file, 'utf8')
  // API prettier не ищет конфиг сам — тянем .prettierrc по пути файла.
  const config = await resolveConfig(file)
  writeFileSync(file, await format(source, { ...config, filepath: file }))
}

console.log(
  `server artifacts: ${operations.length} операций; заготовки: создано ${created}, пропущено ${skipped}; ${path.relative(ROOT, GENERATED_DIR)}`,
)
