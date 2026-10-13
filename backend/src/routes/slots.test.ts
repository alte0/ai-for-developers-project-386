import request from 'supertest'
import { describe, expect, it } from 'vitest'

import { createApp } from '../app.js'
import { toIsoUtc } from '../lib/dates.js'
import { createSqliteStorage } from '../storage/sqlite.js'

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

function startOfUtcDay(ms: number): number {
  return Math.floor(ms / DAY) * DAY
}

function utcWeekday(ms: number): number {
  return (new Date(ms).getUTCDay() + 6) % 7
}

async function seedEventType(
  app: ReturnType<typeof createApp>,
  availabilityMode: 'schedule' | 'windows',
  durationMinutes: number,
): Promise<number> {
  const res = await request(app)
    .post('/api/admin/event-types')
    .send({ name: 'Звонок', durationMinutes, availabilityMode })
  return res.body.id
}

describe('GET /api/slots (генератор свободных Слотов)', () => {
  it('для неизвестного Типа события отвечает 404 event_type_not_found', async () => {
    const res = await request(createApp()).get('/api/slots?eventTypeId=7')

    expect(res.status).toBe(404)
    expect(res.body).toEqual({
      error: { code: 'event_type_not_found', message: expect.any(String) },
    })
  })

  it('без расписания и окон отвечает пустым списком', async () => {
    const app = createApp()
    const scheduleId = await seedEventType(app, 'schedule', 30)
    const windowsId = await seedEventType(app, 'windows', 30)

    expect((await request(app).get(`/api/slots?eventTypeId=${scheduleId}`)).body).toEqual([])
    expect((await request(app).get(`/api/slots?eventTypeId=${windowsId}`)).body).toEqual([])
  })

  it('нарезает окно по длительности, хвост короче длительности отбрасывается', async () => {
    const app = createApp()
    const id = await seedEventType(app, 'windows', 45)
    const day = startOfUtcDay(Date.now()) + DAY
    const start = toIsoUtc(day + 10 * HOUR)
    const end = toIsoUtc(day + 11 * HOUR)
    await request(app).post(`/api/admin/event-types/${id}/windows`).send({ start, end })

    const res = await request(app).get(`/api/slots?eventTypeId=${id}`)

    expect(res.status).toBe(200)
    expect(res.body).toEqual([{ start, end: toIsoUtc(day + 10 * HOUR + 45 * MINUTE) }])
  })

  it('пересекающиеся окна сливаются в один интервал', async () => {
    const app = createApp()
    const id = await seedEventType(app, 'windows', 60)
    const day = startOfUtcDay(Date.now()) + DAY
    await request(app)
      .post(`/api/admin/event-types/${id}/windows`)
      .send({ start: toIsoUtc(day + 10 * HOUR), end: toIsoUtc(day + 11 * HOUR) })
    await request(app)
      .post(`/api/admin/event-types/${id}/windows`)
      .send({
        start: toIsoUtc(day + 10 * HOUR + 30 * MINUTE),
        end: toIsoUtc(day + 11 * HOUR + 30 * MINUTE),
      })

    const res = await request(app).get(`/api/slots?eventTypeId=${id}`)

    expect(res.body).toEqual([{ start: toIsoUtc(day + 10 * HOUR), end: toIsoUtc(day + 11 * HOUR) }])
  })

  it('нарезает расписание по дням недели внутри горизонта', async () => {
    const app = createApp()
    const id = await seedEventType(app, 'schedule', 60)
    const day = startOfUtcDay(Date.now()) + 3 * DAY
    const weekday = utcWeekday(day)
    await request(app)
      .put(`/api/admin/event-types/${id}/schedule`)
      .send([{ weekday, startMinute: 600, endMinute: 660 }])

    const res = await request(app).get(`/api/slots?eventTypeId=${id}`)

    expect(res.body).toEqual([
      { start: toIsoUtc(day + 10 * HOUR), end: toIsoUtc(day + 11 * HOUR) },
      {
        start: toIsoUtc(day + 7 * DAY + 10 * HOUR),
        end: toIsoUtc(day + 7 * DAY + 11 * HOUR),
      },
    ])
  })

  it('замена недели целиком убирает прошлые интервалы из выдачи', async () => {
    const app = createApp()
    const id = await seedEventType(app, 'schedule', 30)
    const day = startOfUtcDay(Date.now()) + 2 * DAY
    const weekday = utcWeekday(day)

    await request(app)
      .put(`/api/admin/event-types/${id}/schedule`)
      .send([{ weekday, startMinute: 600, endMinute: 660 }])
    const first = await request(app).get(`/api/slots?eventTypeId=${id}`)
    expect(first.body.map((slot: { start: string }) => slot.start)).toContain(
      toIsoUtc(day + 10 * HOUR),
    )

    await request(app)
      .put(`/api/admin/event-types/${id}/schedule`)
      .send([{ weekday, startMinute: 840, endMinute: 900 }])
    const second = await request(app).get(`/api/slots?eventTypeId=${id}`)
    const starts = second.body.map((slot: { start: string }) => slot.start)

    expect(starts).toContain(toIsoUtc(day + 14 * HOUR))
    expect(starts).not.toContain(toIsoUtc(day + 10 * HOUR))
    expect(starts).not.toContain(toIsoUtc(day + 10 * HOUR + 30 * MINUTE))
  })

  it('не показывает Слоты в прошлом', async () => {
    const app = createApp()
    const id = await seedEventType(app, 'schedule', 30)
    const now = Date.now()
    const weekday = utcWeekday(startOfUtcDay(now))
    await request(app)
      .put(`/api/admin/event-types/${id}/schedule`)
      .send([{ weekday, startMinute: 0, endMinute: 1440 }])

    const res = await request(app).get(`/api/slots?eventTypeId=${id}`)

    expect(res.body.length).toBeGreaterThan(0)
    for (const slot of res.body as { start: string }[]) {
      expect(slot.start >= toIsoUtc(now)).toBe(true)
    }
  })

  it('горизонт выдачи — 14 дней включительно', async () => {
    const app = createApp()
    const id = await seedEventType(app, 'windows', 30)
    const now = Date.now()
    const near = { start: toIsoUtc(now + 14 * DAY), end: toIsoUtc(now + 14 * DAY + HOUR) }
    const far = { start: toIsoUtc(now + 15 * DAY), end: toIsoUtc(now + 15 * DAY + HOUR) }
    await request(app).post(`/api/admin/event-types/${id}/windows`).send(near)
    await request(app).post(`/api/admin/event-types/${id}/windows`).send(far)

    const res = await request(app).get(`/api/slots?eventTypeId=${id}`)
    const starts = res.body.map((slot: { start: string }) => slot.start)

    expect(starts).toContain(near.start)
    expect(starts).not.toContain(far.start)
  })

  it('окно, начавшееся в прошлом, отдаёт только будущие Слоты', async () => {
    const storage = createSqliteStorage({ path: ':memory:' })
    const app = createApp(storage)
    const id = await seedEventType(app, 'windows', 30)
    const start = toIsoUtc(Date.now() - 3_610_000)
    const end = toIsoUtc(Date.now() + 2 * HOUR)
    storage.createWindow(id, start, end)

    const res = await request(app).get(`/api/slots?eventTypeId=${id}`)
    const gridStart = Date.parse(start)

    expect(res.body).toEqual([
      { start: toIsoUtc(gridStart + 90 * MINUTE), end: toIsoUtc(gridStart + 120 * MINUTE) },
      { start: toIsoUtc(gridStart + 120 * MINUTE), end: toIsoUtc(gridStart + 150 * MINUTE) },
      { start: toIsoUtc(gridStart + 150 * MINUTE), end: toIsoUtc(gridStart + 180 * MINUTE) },
    ])
  })
})
