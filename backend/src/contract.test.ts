import request from 'supertest'
import { describe, expect, it } from 'vitest'

import { createApp } from './app.js'

/**
 * Контрактные проверки по docs/openapi.yaml: структурная валидация входа (ajv)
 * и базовые ответы операций на пустом хранилище.
 */
describe('контракт: валидация входа и базовые ответы', () => {
  it('POST /api/bookings с валидным телом для неизвестного типа отвечает 404', async () => {
    const res = await request(createApp()).post('/api/bookings').send({
      eventTypeId: 1,
      start: '2026-10-13T10:00:00Z',
      name: 'Иван',
      email: 'ivan@example.com',
    })
    expect(res.status).toBe(404)
    expect(res.body).toEqual({
      error: { code: 'event_type_not_found', message: expect.any(String) },
    })
  })

  it('POST /api/bookings без обязательного поля отвечает 400 invalid_request', async () => {
    const res = await request(createApp())
      .post('/api/bookings')
      .send({ eventTypeId: 1, start: '2026-10-13T10:00:00Z', name: 'Иван' })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('invalid_request')
    expect(res.body.error.message).toContain('email')
  })

  it('POST /api/bookings с note длиннее 500 символов отвечает 400', async () => {
    const res = await request(createApp())
      .post('/api/bookings')
      .send({
        eventTypeId: 1,
        start: '2026-10-13T10:00:00Z',
        name: 'Иван',
        email: 'ivan@example.com',
        note: 'x'.repeat(501),
      })
    expect(res.status).toBe(400)
    expect(res.body.error.message).toContain('note')
  })

  it('POST /api/bookings с лишним полем отвечает 400', async () => {
    const res = await request(createApp()).post('/api/bookings').send({
      eventTypeId: 1,
      start: '2026-10-13T10:00:00Z',
      name: 'Иван',
      email: 'ivan@example.com',
      admin: true,
    })
    expect(res.status).toBe(400)
    expect(res.body.error.message).toContain('must NOT have additional properties')
  })

  it('POST /api/bookings с битым JSON отвечает 400, а не 500', async () => {
    const res = await request(createApp())
      .post('/api/bookings')
      .set('Content-Type', 'application/json')
      .send('{"eventTypeId": ')
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('invalid_request')
  })

  it('GET /api/slots без обязательного query-параметра отвечает 400', async () => {
    const res = await request(createApp()).get('/api/slots')
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('invalid_request')
    expect(res.body.error.message).toContain('eventTypeId')
  })

  it('GET /api/slots с нечисловым eventTypeId отвечает 400', async () => {
    const res = await request(createApp()).get('/api/slots?eventTypeId=abc')
    expect(res.status).toBe(400)
    expect(res.body.error.message).toContain('eventTypeId')
  })

  it('GET /api/slots для неизвестного типа отвечает 404 event_type_not_found', async () => {
    const res = await request(createApp()).get('/api/slots?eventTypeId=1')
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('event_type_not_found')
  })

  it('POST /api/admin/event-types с durationMinutes вне 15…480 отвечает 400', async () => {
    const res = await request(createApp())
      .post('/api/admin/event-types')
      .send({ name: 'Воркшоп', durationMinutes: 999, availabilityMode: 'schedule' })
    expect(res.status).toBe(400)
    expect(res.body.error.message).toContain('durationMinutes')
  })

  it('DELETE /api/admin/bookings/1 для неизвестной Записи отвечает 404 not_found', async () => {
    const res = await request(createApp()).delete('/api/admin/bookings/1')
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('not_found')
  })

  it('GET /api/event-types отвечает 200 и пустым списком на пустом хранилище', async () => {
    const res = await request(createApp()).get('/api/event-types')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })
})
