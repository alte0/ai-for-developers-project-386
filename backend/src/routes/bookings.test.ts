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

interface SeededType {
  app: ReturnType<typeof createApp>
  eventTypeId: number
  firstSlotStart: number
  secondSlotStart: number
}

/** Тип «окна» с окном завтра 10:00–11:00 UTC и длительностью 30 минут. */
async function seedWindowsType(): Promise<SeededType> {
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

function bookingBody(eventTypeId: number, start: number, overrides: Record<string, unknown> = {}) {
  return {
    eventTypeId,
    start: toIsoUtc(start),
    name: 'Иван',
    email: 'ivan@example.com',
    ...overrides,
  }
}

describe('POST /api/bookings (Запись гостя)', () => {
  it('создаёт Запись с номером и замороженным концом, отвечает 201', async () => {
    const { app, eventTypeId, firstSlotStart } = await seedWindowsType()

    const res = await request(app)
      .post('/api/bookings')
      .send(bookingBody(eventTypeId, firstSlotStart))

    expect(res.status).toBe(201)
    expect(res.body).toEqual({
      id: 1,
      eventTypeId,
      start: toIsoUtc(firstSlotStart),
      end: toIsoUtc(firstSlotStart + 30 * MINUTE),
    })
    expect(res.body).not.toHaveProperty('name')
    expect(res.body).not.toHaveProperty('email')
  })

  it('несуществующий Тип события → 404 event_type_not_found', async () => {
    const { app, firstSlotStart } = await seedWindowsType()

    const res = await request(app).post('/api/bookings').send(bookingBody(999, firstSlotStart))

    expect(res.status).toBe(404)
    expect(res.body).toEqual({
      error: { code: 'event_type_not_found', message: expect.any(String) },
    })
  })

  it('start в прошлом → 422 slot_out_of_range, даже с некорректным контактом', async () => {
    const { app, eventTypeId } = await seedWindowsType()

    const res = await request(app)
      .post('/api/bookings')
      .send(bookingBody(eventTypeId, Date.now() - DAY, { email: 'не-почта' }))

    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('slot_out_of_range')
  })

  it('start дальше горизонта 14 дней → 422 slot_out_of_range', async () => {
    const { app, eventTypeId } = await seedWindowsType()

    const res = await request(app)
      .post('/api/bookings')
      .send(bookingBody(eventTypeId, Date.now() + 15 * DAY))

    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('slot_out_of_range')
  })

  it('start в горизонте, но не в нарезке → 422 slot_not_scheduled', async () => {
    const { app, eventTypeId, firstSlotStart } = await seedWindowsType()

    const res = await request(app)
      .post('/api/bookings')
      .send(bookingBody(eventTypeId, firstSlotStart + 5 * MINUTE, { email: 'не-почта' }))

    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('slot_not_scheduled')
  })

  it('пустое имя → 422 invalid_contact, даже если Слот уже занят', async () => {
    const { app, eventTypeId, firstSlotStart } = await seedWindowsType()
    await request(app).post('/api/bookings').send(bookingBody(eventTypeId, firstSlotStart))

    const res = await request(app)
      .post('/api/bookings')
      .send(bookingBody(eventTypeId, firstSlotStart, { name: '   ' }))

    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('invalid_contact')
  })

  it('email вне шаблона → 422 invalid_contact', async () => {
    const { app, eventTypeId, firstSlotStart } = await seedWindowsType()

    const res = await request(app)
      .post('/api/bookings')
      .send(bookingBody(eventTypeId, firstSlotStart, { email: 'ivan@example' }))

    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('invalid_contact')
  })

  it('повторная Запись того же Слота → 409 slot_taken', async () => {
    const { app, eventTypeId, firstSlotStart } = await seedWindowsType()
    const first = await request(app)
      .post('/api/bookings')
      .send(bookingBody(eventTypeId, firstSlotStart))
    expect(first.status).toBe(201)

    const second = await request(app)
      .post('/api/bookings')
      .send(bookingBody(eventTypeId, firstSlotStart))

    expect(second.status).toBe(409)
    expect(second.body).toEqual({
      error: { code: 'slot_taken', message: expect.any(String) },
    })
  })

  it('после 201 Слот исчезает из GET /api/slots', async () => {
    const { app, eventTypeId, firstSlotStart, secondSlotStart } = await seedWindowsType()
    await request(app).post('/api/bookings').send(bookingBody(eventTypeId, firstSlotStart))

    const res = await request(app).get(`/api/slots?eventTypeId=${eventTypeId}`)
    const starts = res.body.map((slot: { start: string }) => slot.start)

    expect(starts).toEqual([toIsoUtc(secondSlotStart)])
  })

  it('Запись блокирует время всех Типов событий (общий календарь)', async () => {
    const { app, eventTypeId, firstSlotStart, secondSlotStart } = await seedWindowsType()
    const other = await request(app)
      .post('/api/admin/event-types')
      .send({ name: 'Воркшоп 30 мин', durationMinutes: 30, availabilityMode: 'windows' })
    await request(app)
      .post(`/api/admin/event-types/${other.body.id}/windows`)
      .send({
        start: toIsoUtc(firstSlotStart),
        end: toIsoUtc(secondSlotStart + 30 * MINUTE),
      })

    await request(app).post('/api/bookings').send(bookingBody(eventTypeId, firstSlotStart))

    const res = await request(app).get(`/api/slots?eventTypeId=${other.body.id}`)
    const starts = res.body.map((slot: { start: string }) => slot.start)

    expect(starts).toEqual([toIsoUtc(secondSlotStart)])
  })
})
