/**
 * Эмиттер @typespec/http-client-js перезаписывает spec/client/package.json
 * при каждой компиляции и не пишет поля, нужные для потребления пакета
 * фронтендом (private, types-условия в exports, files). Скрипт дописывает
 * их идемпотентно после `tsp compile`. Руками package.json не править.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const packageJsonPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'client',
  'package.json',
)
const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'))

pkg.private = true
pkg.main = './dist/index.js'
pkg.types = './dist/index.d.ts'
pkg.exports = {
  '.': {
    types: './dist/index.d.ts',
    default: './dist/index.js',
  },
  './models': {
    types: './dist/models/index.d.ts',
    default: './dist/models/index.js',
  },
}
pkg.files = ['dist']

writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`)
console.log(`patched ${packageJsonPath}`)
