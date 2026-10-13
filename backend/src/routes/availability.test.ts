import request from 'supertest'
import { describe, expect, it } from 'vitest'

import { createApp } from '../app.js'
import { toIsoUtc } from '../lib/dates.js'

async function seedEventType(
  app: ReturnType<typeof createApp>,
  availabilityMode: 'schedule' | 'windows',
): Promise<number> {
  const res = await request(app)
    .post('/api/admin/event-types')
    .send({ name: 'Звонок 30 мин', durationMinutes: 30, availabilityMode })
  return res.body.id
}

describe('PUT /api/admin/event-types/:id/schedule (замена недели)', () => {
  it('валидные интервалы принимаются с ответом 200 без тела', async () => {
    const app = createApp()
    const id = await seedEventType(app, 'schedule')

    const res = await request(app)
      .put(`/api/admin/event-types/${id}/schedule`)
      .send([
        { weekday: 0, startMinute: 600, endMinute: 720 },
        { weekday: 0, startMinute: 840, endMinute: 960 },
        { weekday: 4, startMinute: 0, endMinute: 1440 },
      ])

    expect(res.status).toBe(200)
    expect(res.text).toBe('')
  })

  it('пустое тело заменяет неделю на пустую (день свободен)', async () => {
    const app = createApp()
    const id = await seedEventType(app, 'schedule')
    await request(app)
      .put(`/api/admin/event-types/${id}/schedule`)
      .send([{ weekday: 1, startMinute: 600, endMinute: 720 }])

    const res = await request(app).put(`/api/admin/event-types/${id}/schedule`).send([])

    expect(res.status).toBe(200)
    expect(res.text).toBe('')
  })

  it('интервал через полночь отклоняется с 422 invalid_schedule', async () => {
    const app = createApp()
    const id = await seedEventType(app, 'schedule')

    const res = await request(app)
      .put(`/api/admin/event-types/${id}/schedule`)
      .send([{ weekday: 2, startMinute: 1380, endMinute: 60 }])

    expect(res.status).toBe(422)
    expect(res.body).toEqual({
      error: { code: 'invalid_schedule', message: expect.any(String) },
    })
  })

  it('интервал с началом, равным концу, отклоняется с 422 invalid_schedule', async () => {
    const app = createApp()
    const id = await seedEventType(app, 'schedule')

    const res = await request(app)
      .put(`/api/admin/event-types/${id}/schedule`)
      .send([{ weekday: 3, startMinute: 600, endMinute: 600 }])

    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('invalid_schedule')
  })

  it('weekday вне 0…6 отклоняется структурной валидацией с 400', async () => {
    const app = createApp()
    const id = await seedEventType(app, 'schedule')

    const res = await request(app)
      .put(`/api/admin/event-types/${id}/schedule`)
      .send([{ weekday: 7, startMinute: 600, endMinute: 720 }])

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('invalid_request')
    expect(res.body.error.message).toContain('weekday')
  })

  it('расписание неизвестного типа отвечает 404 event_type_not_found', async () => {
    const res = await request(createApp())
      .put('/api/admin/event-types/42/schedule')
      .send([{ weekday: 0, startMinute: 600, endMinute: 720 }])

    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('event_type_not_found')
  })
})

describe('Ручные окна доступности', () => {
  it('у нового типа список окон пуст', async () => {
    const app = createApp()
    const id = await seedEventType(app, 'windows')

    const res = await request(app).get(`/api/admin/event-types/${id}/windows`)

    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('POST окна в будущем создаёт окно с датами в ISO-8601 UTC', async () => {
    const app = createApp()
    const id = await seedEventType(app, 'windows')
    const start = toIsoUtc(Date.now() + 60 * 60 * 1000)
    const end = toIsoUtc(Date.now() + 2 * 60 * 60 * 1000)

    const res = await request(app).post(`/api/admin/event-types/${id}/windows`).send({ start, end })

    expect(res.status).toBe(201)
    expect(res.body).toEqual({ id: expect.any(Number), start, end })
    const list = await request(app).get(`/api/admin/event-types/${id}/windows`)
    expect(list.body).toEqual([res.body])
  })

  it('POST окна в прошлом отвечает 422 invalid_window', async () => {
    const app = createApp()
    const id = await seedEventType(app, 'windows')

    const res = await request(app)
      .post(`/api/admin/event-types/${id}/windows`)
      .send({
        start: toIsoUtc(Date.now() - 2 * 60 * 60 * 1000),
        end: toIsoUtc(Date.now() - 60 * 60 * 1000),
      })

    expect(res.status).toBe(422)
    expect(res.body).toEqual({
      error: { code: 'invalid_window', message: expect.any(String) },
    })
  })

  it('POST окна с началом не раньше конца отвечает 422 invalid_window', async () => {
    const app = createApp()
    const id = await seedEventType(app, 'windows')
    const start = toIsoUtc(Date.now() + 60 * 60 * 1000)

    const res = await request(app)
      .post(`/api/admin/event-types/${id}/windows`)
      .send({ start, end: start })

    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('invalid_window')
  })

  it('POST окна для неизвестного типа отвечает 404 event_type_not_found', async () => {
    const res = await request(createApp())
      .post('/api/admin/event-types/42/windows')
      .send({ start: toIsoUtc(Date.now() + 60000), end: toIsoUtc(Date.now() + 120000) })

    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('event_type_not_found')
  })

  it('пересекающиеся окна разрешены — оба создаются', async () => {
    const app = createApp()
    const id = await seedEventType(app, 'windows')

    const first = await request(app)
      .post(`/api/admin/event-types/${id}/windows`)
      .send({
        start: toIsoUtc(Date.now() + 60 * 60 * 1000),
        end: toIsoUtc(Date.now() + 3 * 60 * 60 * 1000),
      })
    const second = await request(app)
      .post(`/api/admin/event-types/${id}/windows`)
      .send({
        start: toIsoUtc(Date.now() + 2 * 60 * 60 * 1000),
        end: toIsoUtc(Date.now() + 4 * 60 * 60 * 1000),
      })

    expect(first.status).toBe(201)
    expect(second.status).toBe(201)
  })

  it('DELETE окна удаляет его; повторное удаление отвечает 404 not_found', async () => {
    const app = createApp()
    const id = await seedEventType(app, 'windows')
    const created = await request(app)
      .post(`/api/admin/event-types/${id}/windows`)
      .send({
        start: toIsoUtc(Date.now() + 60 * 60 * 1000),
        end: toIsoUtc(Date.now() + 2 * 60 * 60 * 1000),
      })

    const del = await request(app).delete(`/api/admin/windows/${created.body.id}`)

    expect(del.status).toBe(204)
    expect((await request(app).get(`/api/admin/event-types/${id}/windows`)).body).toEqual([])
    const again = await request(app).delete(`/api/admin/windows/${created.body.id}`)
    expect(again.status).toBe(404)
    expect(again.body.error.code).toBe('not_found')
  })

  it('GET окон неизвестного типа отвечает 404 event_type_not_found', async () => {
    const res = await request(createApp()).get('/api/admin/event-types/42/windows')

    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('event_type_not_found')
  })
})
