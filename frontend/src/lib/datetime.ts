import { DISPLAY_TIME_ZONE } from '@/config'

const DAY_FORMAT = new Intl.DateTimeFormat('ru-RU', {
  timeZone: DISPLAY_TIME_ZONE,
  weekday: 'short',
  day: 'numeric',
  month: 'long',
})

const TIME_FORMAT = new Intl.DateTimeFormat('ru-RU', {
  timeZone: DISPLAY_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
})

const DAY_KEY_FORMAT = new Intl.DateTimeFormat('en-CA', {
  timeZone: DISPLAY_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** «вт, 13 октября» — заголовок группы слотов по дате (docs/spec.md §1.2). */
export function formatDay(date: Date): string {
  return DAY_FORMAT.format(date)
}

/** «10:00» — время слота в таймзоне показа. */
export function formatTime(date: Date): string {
  return TIME_FORMAT.format(date)
}

/** «10:00 – 12:00» — интервал слота в таймзоне показа. */
export function formatInterval(start: Date, end: Date): string {
  return `${formatTime(start)} – ${formatTime(end)}`
}

/** Стабильный ключ дня (YYYY-MM-DD в таймзоне показа) для группировки слотов. */
export function dayKey(date: Date): string {
  return DAY_KEY_FORMAT.format(date)
}

export const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const

/** Минуты суток → «10:00» для редактора расписания. */
export function formatMinuteOfDay(minutes: number): string {
  const hour = Math.floor(minutes / 60)
  const minute = minutes % 60
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

/** «10:00» → минуты суток (NaN при кривом вводе). */
export function parseMinuteOfDay(value: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!match) return Number.NaN
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (hour > 23 || minute > 59) return Number.NaN
  return hour * 60 + minute
}
