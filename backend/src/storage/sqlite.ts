import { mkdirSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { dirname, resolve } from 'node:path'

import { toIsoUtc } from '../lib/dates.js'
import type {
  AvailabilityMode,
  BookingRecord,
  CreateBookingResult,
  DeleteEventTypeResult,
  EventTypePatch,
  EventTypeRecord,
  NewBooking,
  NewEventType,
  ScheduleIntervalRecord,
  Storage,
  WindowRecord,
} from './types.js'

const SCHEMA = `
CREATE TABLE IF NOT EXISTS event_type (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  availability_mode TEXT NOT NULL CHECK (availability_mode IN ('schedule', 'windows'))
);

CREATE TABLE IF NOT EXISTS event_type_schedule (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type_id INTEGER NOT NULL REFERENCES event_type(id) ON DELETE RESTRICT,
  weekday INTEGER NOT NULL,
  start_minute INTEGER NOT NULL,
  end_minute INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS event_type_window (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type_id INTEGER NOT NULL REFERENCES event_type(id) ON DELETE RESTRICT,
  start TEXT NOT NULL,
  end TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS booking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type_id INTEGER NOT NULL REFERENCES event_type(id) ON DELETE RESTRICT,
  start TEXT NOT NULL,
  end TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (start, end)
);
`

type Row = Record<string, string | number | bigint | Uint8Array | null>

function asString(value: Row[keyof Row]): string {
  return String(value)
}

function asNumber(value: Row[keyof Row]): number {
  return Number(value)
}

function availabilityModeOf(value: Row[keyof Row]): AvailabilityMode {
  return asString(value) === 'windows' ? 'windows' : 'schedule'
}

function mapEventType(row: Row): EventTypeRecord {
  return {
    id: asNumber(row.id),
    name: asString(row.name),
    durationMinutes: asNumber(row.duration_minutes),
    availabilityMode: availabilityModeOf(row.availability_mode),
  }
}

function mapSchedule(row: Row): ScheduleIntervalRecord {
  return {
    weekday: asNumber(row.weekday),
    startMinute: asNumber(row.start_minute),
    endMinute: asNumber(row.end_minute),
  }
}

function mapWindow(row: Row): WindowRecord {
  return {
    id: asNumber(row.id),
    eventTypeId: asNumber(row.event_type_id),
    start: asString(row.start),
    end: asString(row.end),
  }
}

function mapBooking(row: Row): BookingRecord {
  return {
    id: asNumber(row.id),
    eventTypeId: asNumber(row.event_type_id),
    start: asString(row.start),
    end: asString(row.end),
    name: asString(row.name),
    email: asString(row.email),
    note: row.note === null ? null : asString(row.note),
    createdAt: asString(row.created_at),
  }
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Error && error.message.includes('UNIQUE constraint failed')
}

export interface SqliteStorageOptions {
  /** Файл БД или `:memory:` для тестов. */
  path: string
}

export function createSqliteStorage(options: SqliteStorageOptions): Storage {
  const filename = resolve(options.path)
  mkdirSync(dirname(filename), { recursive: true })
  const db = new DatabaseSync(options.path)
  db.exec('PRAGMA foreign_keys = ON')
  db.exec(SCHEMA)

  const getEventType = (id: number): EventTypeRecord | undefined => {
    const row = db.prepare('SELECT * FROM event_type WHERE id = ?').get(id)
    return row ? mapEventType(row) : undefined
  }

  const deleteBooking = (id: number): boolean =>
    db.prepare('DELETE FROM booking WHERE id = ?').run(id).changes > 0

  return {
    listEventTypes(): EventTypeRecord[] {
      return db.prepare('SELECT * FROM event_type ORDER BY id').all().map(mapEventType)
    },

    getEventType,

    createEventType(input: NewEventType): EventTypeRecord {
      const info = db
        .prepare(
          'INSERT INTO event_type (name, duration_minutes, availability_mode) VALUES (?, ?, ?)',
        )
        .run(input.name, input.durationMinutes, input.availabilityMode)
      const created = getEventType(Number(info.lastInsertRowid))
      if (!created) throw new Error('тип события не найден после вставки')
      return created
    },

    updateEventType(id: number, patch: EventTypePatch): EventTypeRecord | undefined {
      const existing = getEventType(id)
      if (!existing) return undefined
      db.prepare('UPDATE event_type SET name = ?, duration_minutes = ? WHERE id = ?').run(
        patch.name ?? existing.name,
        patch.durationMinutes ?? existing.durationMinutes,
        id,
      )
      return getEventType(id)
    },

    deleteEventType(id: number): DeleteEventTypeResult {
      if (!getEventType(id)) return 'not_found'
      const bookings = db
        .prepare('SELECT COUNT(*) AS count FROM booking WHERE event_type_id = ?')
        .get(id)
      if (bookings && asNumber(bookings.count) > 0) return 'has_bookings'
      db.exec('BEGIN IMMEDIATE')
      try {
        db.prepare('DELETE FROM event_type_schedule WHERE event_type_id = ?').run(id)
        db.prepare('DELETE FROM event_type_window WHERE event_type_id = ?').run(id)
        db.prepare('DELETE FROM event_type WHERE id = ?').run(id)
        db.exec('COMMIT')
      } catch (error) {
        db.exec('ROLLBACK')
        throw error
      }
      return 'deleted'
    },

    listSchedule(eventTypeId: number): ScheduleIntervalRecord[] {
      return db
        .prepare(
          'SELECT * FROM event_type_schedule WHERE event_type_id = ? ORDER BY weekday, start_minute',
        )
        .all(eventTypeId)
        .map(mapSchedule)
    },

    replaceSchedule(eventTypeId: number, intervals: ScheduleIntervalRecord[]): void {
      db.exec('BEGIN IMMEDIATE')
      try {
        db.prepare('DELETE FROM event_type_schedule WHERE event_type_id = ?').run(eventTypeId)
        const insert = db.prepare(
          'INSERT INTO event_type_schedule (event_type_id, weekday, start_minute, end_minute) VALUES (?, ?, ?, ?)',
        )
        for (const interval of intervals) {
          insert.run(eventTypeId, interval.weekday, interval.startMinute, interval.endMinute)
        }
        db.exec('COMMIT')
      } catch (error) {
        db.exec('ROLLBACK')
        throw error
      }
    },

    listWindows(eventTypeId: number): WindowRecord[] {
      return db
        .prepare('SELECT * FROM event_type_window WHERE event_type_id = ? ORDER BY start, id')
        .all(eventTypeId)
        .map(mapWindow)
    },

    createWindow(eventTypeId: number, start: string, end: string): WindowRecord {
      const info = db
        .prepare('INSERT INTO event_type_window (event_type_id, start, end) VALUES (?, ?, ?)')
        .run(eventTypeId, start, end)
      const row = db
        .prepare('SELECT * FROM event_type_window WHERE id = ?')
        .get(Number(info.lastInsertRowid))
      if (!row) throw new Error('окно не найдено после вставки')
      return mapWindow(row)
    },

    deleteWindow(id: number): boolean {
      return db.prepare('DELETE FROM event_type_window WHERE id = ?').run(id).changes > 0
    },

    listBookings(from?: string): BookingRecord[] {
      const rows = from
        ? db.prepare('SELECT * FROM booking WHERE start >= ? ORDER BY start, id').all(from)
        : db.prepare('SELECT * FROM booking ORDER BY start, id').all()
      return rows.map(mapBooking)
    },

    deleteBooking,

    createBooking(input: NewBooking): CreateBookingResult {
      db.exec('BEGIN IMMEDIATE')
      try {
        const overlap = db
          .prepare('SELECT id FROM booking WHERE start < ? AND end > ? LIMIT 1')
          .get(input.end, input.start)
        if (overlap) {
          db.exec('ROLLBACK')
          return { status: 'taken' }
        }
        const info = db
          .prepare(
            'INSERT INTO booking (event_type_id, start, end, name, email, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          )
          .run(
            input.eventTypeId,
            input.start,
            input.end,
            input.name,
            input.email,
            input.note,
            toIsoUtc(Date.now()),
          )
        const row = db
          .prepare('SELECT * FROM booking WHERE id = ?')
          .get(Number(info.lastInsertRowid))
        if (!row) throw new Error('запись не найдена после вставки')
        const booking = mapBooking(row)
        db.exec('COMMIT')
        return { status: 'created', booking }
      } catch (error) {
        db.exec('ROLLBACK')
        if (isUniqueViolation(error)) return { status: 'taken' }
        throw error
      }
    },
  }
}
