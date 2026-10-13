import request from 'supertest'
import { describe, expect, it } from 'vitest'

import { createApp } from '../app.js'
import { toIsoUtc } from '../lib/dates.js'

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

function startOfUtcDay(ms: number): number {
  return Math.floor(ms / DAY) * DAY
}

interface Seeded {
  app: ReturnType<typeof createApp>
  eventTypeId: number
  firstSlotStart: number
  secondSlotStart: number
}

async function seedTypeWithTwoSlots(): Promise<Seeded> {
  const app = createApp()
  const created = await request(app)
    .post('/api/admin/event-types')
    .send({ name: 'Звонок 30 мин', durationMinutes: 30, availabilityMode: 'windows' })
  const eventTypeId = created.body.id
  const day = startOfUtcDay(Date.now()) + DAY
  await request(app)
    .post(`/api/admin/event-types/${eventTypeId}/windows`)
    .send({ start: toIsoUtc(day + 10 * HOUR), end: toIsoUtc(day + 11 * HOUR) })
  return {
    app,
    eventTypeId,
    firstSlotStart: day + 10 * HOUR,
    secondSlotStart: day + 10 * HOUR + 30 * MINUTE,
  }
}

function book(seeded: Seeded, slotStart: number, overrides: Record<string, unknown> = {}) {
  return request(seeded.app)
    .post('/api/bookings')
    .send({
      eventTypeId: seeded.eventTypeId,
      start: toIsoUtc(slotStart),
      name: 'Иван',
      email: 'ivan@example.com',
      ...overrides,
    })
}

describe('GET /api/admin/bookings (журнал Записей)', () => {
  it('отдаёт Записи с контактом и временем создания в ISO-8601 UTC', async () => {
    const seeded = await seedTypeWithTwoSlots()
    await book(seeded, seeded.firstSlotStart, { note: 'Обсудить проект' })

    const res = await request(seeded.app).get('/api/admin/bookings')

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    const [entry] = res.body
    expect(entry).toMatchObject({
      id: 1,
      eventTypeId: seeded.eventTypeId,
      start: toIsoUtc(seeded.firstSlotStart),
      end: toIsoUtc(seeded.firstSlotStart + 30 * MINUTE),
      name: 'Иван',
      email: 'ivan@example.com',
      note: 'Обсудить проект',
    })
    expect(entry.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/)
  })

  it('без заметки поле note отсутствует в ответе', async () => {
    const seeded = await seedTypeWithTwoSlots()
    await book(seeded, seeded.firstSlotStart)

    const res = await request(seeded.app).get('/api/admin/bookings')

    expect(res.body[0]).not.toHaveProperty('note')
  })

  it('фильтр ?from= показывает только Записи не раньше отсечки', async () => {
    const seeded = await seedTypeWithTwoSlots()
    await book(seeded, seeded.firstSlotStart)
    await book(seeded, seeded.secondSlotStart)

    const res = await request(seeded.app).get(
      `/api/admin/bookings?from=${toIsoUtc(seeded.secondSlotStart)}`,
    )

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].start).toBe(toIsoUtc(seeded.secondSlotStart))
  })
})

describe('DELETE /api/admin/bookings/:id (отмена Владельцем)', () => {
  it('отмена освобождает время — Слот снова доступен в GET /api/slots', async () => {
    const seeded = await seedTypeWithTwoSlots()
    const created = await book(seeded, seeded.firstSlotStart)
    const beforeCancel = await request(seeded.app).get(
      `/api/slots?eventTypeId=${seeded.eventTypeId}`,
    )
    expect(beforeCancel.body.map((slot: { start: string }) => slot.start)).toEqual([
      toIsoUtc(seeded.secondSlotStart),
    ])

    const del = await request(seeded.app).delete(`/api/admin/bookings/${created.body.id}`)

    expect(del.status).toBe(204)
    const afterCancel = await request(seeded.app).get(
      `/api/slots?eventTypeId=${seeded.eventTypeId}`,
    )
    expect(afterCancel.body.map((slot: { start: string }) => slot.start)).toEqual([
      toIsoUtc(seeded.firstSlotStart),
      toIsoUtc(seeded.secondSlotStart),
    ])
    expect((await request(seeded.app).get('/api/admin/bookings')).body).toEqual([])
  })

  it('повторная отмена отвечает 404 not_found', async () => {
    const seeded = await seedTypeWithTwoSlots()
    const created = await book(seeded, seeded.firstSlotStart)
    await request(seeded.app).delete(`/api/admin/bookings/${created.body.id}`)

    const res = await request(seeded.app).delete(`/api/admin/bookings/${created.body.id}`)

    expect(res.status).toBe(404)
    expect(res.body).toEqual({
      error: { code: 'not_found', message: expect.any(String) },
    })
  })
})

describe('Зависимости Типа события от Записей', () => {
  it('удаление Типа с Записями отвечает 409 event_type_has_bookings с сообщением', async () => {
    const seeded = await seedTypeWithTwoSlots()
    await book(seeded, seeded.firstSlotStart)

    const res = await request(seeded.app).delete(`/api/admin/event-types/${seeded.eventTypeId}`)

    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('event_type_has_bookings')
    expect(res.body.error.message).toBeTruthy()
  })

  it('смена длительности не меняет конец существующей Записи', async () => {
    const seeded = await seedTypeWithTwoSlots()
    const created = await book(seeded, seeded.firstSlotStart)

    const patched = await request(seeded.app)
      .patch(`/api/admin/event-types/${seeded.eventTypeId}`)
      .send({ durationMinutes: 60 })

    expect(patched.status).toBe(200)
    expect(patched.body.durationMinutes).toBe(60)
    const journal = await request(seeded.app).get('/api/admin/bookings')
    expect(journal.body[0]).toMatchObject({
      id: created.body.id,
      start: toIsoUtc(seeded.firstSlotStart),
      end: toIsoUtc(seeded.firstSlotStart + 30 * MINUTE),
    })
  })

  it('удаление Типа с расписанием и окнами проходит — зависимости уходят вместе', async () => {
    const app = createApp()
    const created = await request(app)
      .post('/api/admin/event-types')
      .send({ name: 'Звонок', durationMinutes: 30, availabilityMode: 'windows' })
    await request(app)
      .post(`/api/admin/event-types/${created.body.id}/windows`)
      .send({
        start: toIsoUtc(Date.now() + HOUR),
        end: toIsoUtc(Date.now() + 2 * HOUR),
      })

    const res = await request(app).delete(`/api/admin/event-types/${created.body.id}`)

    expect(res.status).toBe(204)
    expect((await request(app).get('/api/admin/event-types')).body).toEqual([])
  })
})
