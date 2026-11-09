import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import request from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'
import { createApp } from './app.js'

const staticDir = mkdtempSync(path.join(tmpdir(), 'booking-static-'))
writeFileSync(path.join(staticDir, 'index.html'), '<!doctype html><title>booking</title>')
mkdirSync(path.join(staticDir, 'assets'))
writeFileSync(path.join(staticDir, 'assets', 'app.js'), 'console.log("app")')

afterAll(() => {
  rmSync(staticDir, { recursive: true, force: true })
})

const app = createApp(undefined, { staticDir })

describe('статика фронтенда в контейнерном образе', () => {
  it('GET / отдаёт index.html', async () => {
    const res = await request(app).get('/')
    expect(res.status).toBe(200)
    expect(res.text).toContain('<title>booking</title>')
  })

  it('GET /booking отдаёт index.html (SPA-fallback)', async () => {
    const res = await request(app).get('/booking')
    expect(res.status).toBe(200)
    expect(res.text).toContain('<title>booking</title>')
  })

  it('GET /assets/app.js отдаёт собранный файл', async () => {
    const res = await request(app).get('/assets/app.js')
    expect(res.status).toBe(200)
    expect(res.text).toBe('console.log("app")')
  })

  it('GET /api/health остаётся API-ответом', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok' })
  })

  it('GET /api/unknown не подменяется index.html', async () => {
    const res = await request(app).get('/api/unknown')
    expect(res.status).toBe(404)
    expect(res.text).not.toContain('<title>booking</title>')
  })

  it('HEAD /booking отвечает 200', async () => {
    const res = await request(app).head('/booking')
    expect(res.status).toBe(200)
  })
})
