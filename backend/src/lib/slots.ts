import type { AvailabilityMode, ScheduleIntervalRecord, WindowRecord } from '../storage/types.js'

const MINUTE_MS = 60 * 1000
const DAY_MS = 24 * 60 * MINUTE_MS

export interface GeneratedSlot {
  start: number
  end: number
}

interface Interval {
  start: number
  end: number
}

export interface GenerateSlotsInput {
  durationMinutes: number
  availabilityMode: AvailabilityMode
  schedule: ScheduleIntervalRecord[]
  windows: WindowRecord[]
  /** Записи общего календаря Владельца; исключают пересекающиеся Слоты. */
  bookings?: { start: string; end: string }[]
  now: number
  horizonMs: number
}

/** 0 — понедельник … 6 — воскресенье (как в контракте расписания). */
function utcWeekday(ms: number): number {
  return (new Date(ms).getUTCDay() + 6) % 7
}

function scheduleIntervals(
  schedule: ScheduleIntervalRecord[],
  from: number,
  to: number,
): Interval[] {
  const intervals: Interval[] = []
  const firstDay = Math.floor(from / DAY_MS) * DAY_MS
  const lastDay = Math.floor(to / DAY_MS) * DAY_MS
  for (let day = firstDay; day <= lastDay; day += DAY_MS) {
    const weekday = utcWeekday(day)
    for (const row of schedule) {
      if (row.weekday !== weekday) continue
      intervals.push({
        start: day + row.startMinute * MINUTE_MS,
        end: day + row.endMinute * MINUTE_MS,
      })
    }
  }
  return intervals
}

function mergeIntervals(intervals: Interval[]): Interval[] {
  const sorted = [...intervals].sort((a, b) => a.start - b.start)
  const merged: Interval[] = []
  for (const interval of sorted) {
    const last = merged[merged.length - 1]
    if (last && interval.start <= last.end) {
      if (interval.end > last.end) last.end = interval.end
    } else {
      merged.push({ ...interval })
    }
  }
  return merged
}

/**
 * Генератор Слотов «на лету» (docs/spec.md §4): расписание или окна типа
 * нарезаются по длительности Типа события от начала интервала, хвосты
 * короче длительности отбрасываются, выдача — `now … now + горизонт`,
 * пересекающиеся с Записями Слоты исключаются.
 */
export function generateSlots(input: GenerateSlotsInput): GeneratedSlot[] {
  const { now, horizonMs, durationMinutes, availabilityMode } = input
  const horizonEnd = now + horizonMs
  const durationMs = durationMinutes * MINUTE_MS

  const source: Interval[] =
    availabilityMode === 'schedule'
      ? scheduleIntervals(input.schedule, now, horizonEnd)
      : input.windows
          .map((window) => ({ start: Date.parse(window.start), end: Date.parse(window.end) }))
          .filter((window) => window.end > now)

  const slots: GeneratedSlot[] = []
  for (const interval of mergeIntervals(source)) {
    let start = interval.start
    if (start < now) {
      start += Math.ceil((now - start) / durationMs) * durationMs
    }
    for (; start + durationMs <= interval.end; start += durationMs) {
      if (start < now || start > horizonEnd) continue
      slots.push({ start, end: start + durationMs })
    }
  }

  const bookings = input.bookings ?? []
  if (bookings.length === 0) return slots
  const bookingIntervals = bookings.map((booking) => ({
    start: Date.parse(booking.start),
    end: Date.parse(booking.end),
  }))
  return slots.filter(
    (slot) =>
      !bookingIntervals.some((booking) => slot.start < booking.end && booking.start < slot.end),
  )
}
