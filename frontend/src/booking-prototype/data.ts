// ПРОТОТИП (#9): моковые данные гостевого сценария. Не продакшн, без API.

export type EventType = {
  id: string
  name: string
  durationMin: number
  description: string
}

export type Slot = {
  id: string
  eventTypeId: string
  /** ISO, UTC */
  start: string
  end: string
}

export const EVENT_TYPES: EventType[] = [
  {
    id: 'consult',
    name: 'Консультация',
    durationMin: 30,
    description: 'Короткий созвон по вопросу или плану работ',
  },
  {
    id: 'code-review',
    name: 'Разбор кода',
    durationMin: 60,
    description: 'Разбор PR или архитектурного решения',
  },
  {
    id: 'deep-dive',
    name: 'Глубокий разбор',
    durationMin: 90,
    description: 'Детальный аудит проекта с рекомендациями',
  },
  {
    id: 'workshop',
    name: 'Воркшоп',
    durationMin: 120,
    description: 'Демо-свободный тип: в ближайшие 14 дней свободных слотов нет',
  },
]

function startOfUtcDay(offsetDays: number): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offsetDays))
}

function iso(d: Date): string {
  return d.toISOString()
}

function buildSlots(): Slot[] {
  const slots: Slot[] = []
  // «Ядовитые» слоты: часть заняты (TAKEN), часть — гонка при submit (RACE).
  const poison = new Set(['consult-1d-10', 'code-review-2d-15', 'deep-dive-3d-11'])
  for (let day = 1; day <= 5; day++) {
    const base = startOfUtcDay(day)
    const times: Record<string, number[]> = {
      consult: [10, 11, 15, 16],
      'code-review': [9, 13, 15],
      'deep-dive': [11, 14],
    }
    for (const [typeId, hours] of Object.entries(times)) {
      const duration = EVENT_TYPES.find((t) => t.id === typeId)?.durationMin ?? 30
      for (const h of hours) {
        const start = new Date(base)
        start.setUTCHours(h, 0, 0, 0)
        const end = new Date(start.getTime() + duration * 60_000)
        const id = `${typeId}-${day}d-${h}`
        slots.push({ id, eventTypeId: typeId, start: iso(start), end: iso(end) })
        if (poison.has(id)) {
          // ядовитый слот занимаем «призрачной» записью — при выборе будет 409
        }
      }
    }
  }
  // «Слоты, занятые уже существующими записями» — исчезают из списка (глоссарий).
  return slots.filter((s) => s.id !== 'consult-2d-11' && s.id !== 'code-review-3d-13')
}

export const ALL_SLOTS: Slot[] = buildSlots()
/** Слоты, уже занятые чужой записью: видны, но не selectable. */
export const TAKEN_SLOT_IDS = new Set(['consult-1d-10', 'code-review-2d-15', 'deep-dive-3d-11'])
/** «Гонка»: слот выглядит свободным, но на submit прилетает 409. */
export const RACE_SLOT_IDS = new Set(['consult-3d-15', 'code-review-4d-13', 'deep-dive-2d-14'])

export type BookingResult =
  | { ok: true; confirmation: string; slot: Slot; name: string; email: string; note: string }
  | { ok: false; status: 409; message: string }

export function createBooking(
  slot: Slot,
  fields: { name: string; email: string; note: string },
): BookingResult {
  if (RACE_SLOT_IDS.has(slot.id)) {
    return {
      ok: false,
      status: 409,
      message: 'Этот слот уже занят. Выберите другое время.',
    }
  }
  const conf = `CAL-${slot.id.toUpperCase().replaceAll('-', '')}`
  return { ok: true, confirmation: conf, slot, ...fields }
}

const fmtTime = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
})
const fmtDate = new Intl.DateTimeFormat('ru-RU', {
  weekday: 'short',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
})
const fmtDateLong = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

export function slotTimeRange(slot: Slot): string {
  return `${fmtTime.format(new Date(slot.start))}–${fmtTime.format(new Date(slot.end))}`
}

export function slotDayLabel(slot: Slot): string {
  return fmtDate.format(new Date(slot.start))
}

export function slotDayLong(slot: Slot): string {
  return fmtDateLong.format(new Date(slot.start))
}

export function slotsForType(eventTypeId: string): Slot[] {
  return ALL_SLOTS.filter((s) => s.eventTypeId === eventTypeId)
}
