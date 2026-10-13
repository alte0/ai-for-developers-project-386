import request from 'supertest'
import { describe, expect, it } from 'vitest'

import { createApp } from '../app.js'

describe('Типы событий: админское создание', () => {
  it('POST /api/admin/event-types создаёт тип и отвечает 201', async () => {
    const res = await request(createApp())
      .post('/api/admin/event-types')
      .send({ name: 'Звонок 30 мин', durationMinutes: 30, availabilityMode: 'schedule' })

    expect(res.status).toBe(201)
    expect(res.body).toEqual({
      id: 1,
      name: 'Звонок 30 мин',
      durationMinutes: 30,
      availabilityMode: 'schedule',
    })
  })

  it('имя, состоящее из пробелов, отклоняется с 422 invalid_name', async () => {
    const res = await request(createApp())
      .post('/api/admin/event-types')
      .send({ name: '   ', durationMinutes: 30, availabilityMode: 'windows' })

    expect(res.status).toBe(422)
    expect(res.body).toEqual({
      error: { code: 'invalid_name', message: expect.any(String) },
    })
  })
})

describe('Гостевая проекция Типов событий', () => {
  it('GET /api/event-types отдаёт только проекцию гостя, без availabilityMode', async () => {
    const app = createApp()
    await request(app)
      .post('/api/admin/event-types')
      .send({ name: 'Звонок 30 мин', durationMinutes: 30, availabilityMode: 'schedule' })
    await request(app)
      .post('/api/admin/event-types')
      .send({ name: 'Воркшоп', durationMinutes: 90, availabilityMode: 'windows' })

    const res = await request(app).get('/api/event-types')

    expect(res.status).toBe(200)
    expect(res.body).toEqual([
      { id: 1, name: 'Звонок 30 мин', durationMinutes: 30 },
      { id: 2, name: 'Воркшоп', durationMinutes: 90 },
    ])
  })

  it('на пустом хранилище отвечает 200 с пустым списком', async () => {
    const res = await request(createApp()).get('/api/event-types')

    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })
})

describe('Админский просмотр Типов событий', () => {
  it('GET /api/admin/event-types отдаёт типы вместе с availabilityMode', async () => {
    const app = createApp()
    await request(app)
      .post('/api/admin/event-types')
      .send({ name: 'Звонок 30 мин', durationMinutes: 30, availabilityMode: 'schedule' })

    const res = await request(app).get('/api/admin/event-types')

    expect(res.status).toBe(200)
    expect(res.body).toEqual([
      { id: 1, name: 'Звонок 30 мин', durationMinutes: 30, availabilityMode: 'schedule' },
    ])
  })

  it('GET /api/admin/event-types/:id отдаёт один тип', async () => {
    const app = createApp()
    await request(app)
      .post('/api/admin/event-types')
      .send({ name: 'Воркшоп', durationMinutes: 90, availabilityMode: 'windows' })

    const res = await request(app).get('/api/admin/event-types/1')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      id: 1,
      name: 'Воркшоп',
      durationMinutes: 90,
      availabilityMode: 'windows',
    })
  })

  it('GET /api/admin/event-types/:id для неизвестного id отвечает 404 event_type_not_found', async () => {
    const res = await request(createApp()).get('/api/admin/event-types/99')

    expect(res.status).toBe(404)
    expect(res.body).toEqual({
      error: { code: 'event_type_not_found', message: expect.any(String) },
    })
  })
})

describe('Редактирование Типа события', () => {
  it('PATCH переименовывает, не трогая длительность', async () => {
    const app = createApp()
    await request(app)
      .post('/api/admin/event-types')
      .send({ name: 'Звонок 30 мин', durationMinutes: 30, availabilityMode: 'schedule' })

    const res = await request(app)
      .patch('/api/admin/event-types/1')
      .send({ name: 'Быстрый звонок' })

    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      id: 1,
      name: 'Быстрый звонок',
      durationMinutes: 30,
      availabilityMode: 'schedule',
    })
  })

  it('PATCH меняет длительность, не трогая название', async () => {
    const app = createApp()
    await request(app)
      .post('/api/admin/event-types')
      .send({ name: 'Звонок', durationMinutes: 30, availabilityMode: 'schedule' })

    const res = await request(app).patch('/api/admin/event-types/1').send({ durationMinutes: 45 })

    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      id: 1,
      name: 'Звонок',
      durationMinutes: 45,
      availabilityMode: 'schedule',
    })
  })

  it('PATCH с пустым именем отвечает 422 invalid_name', async () => {
    const app = createApp()
    await request(app)
      .post('/api/admin/event-types')
      .send({ name: 'Звонок', durationMinutes: 30, availabilityMode: 'schedule' })

    const res = await request(app).patch('/api/admin/event-types/1').send({ name: ' ' })

    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('invalid_name')
  })

  it('PATCH неизвестного id отвечает 404 event_type_not_found', async () => {
    const res = await request(createApp()).patch('/api/admin/event-types/77').send({ name: 'Нет' })

    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('event_type_not_found')
  })
})

describe('Удаление Типа события', () => {
  it('DELETE удаляет тип, после чего он недоступен', async () => {
    const app = createApp()
    await request(app)
      .post('/api/admin/event-types')
      .send({ name: 'Звонок', durationMinutes: 30, availabilityMode: 'schedule' })

    const del = await request(app).delete('/api/admin/event-types/1')

    expect(del.status).toBe(204)
    expect((await request(app).get('/api/admin/event-types/1')).status).toBe(404)
    expect((await request(app).get('/api/admin/event-types')).body).toEqual([])
    expect((await request(app).get('/api/event-types')).body).toEqual([])
  })

  it('DELETE неизвестного id отвечает 404 event_type_not_found', async () => {
    const res = await request(createApp()).delete('/api/admin/event-types/5')

    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('event_type_not_found')
  })
})
