import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import {
  createBooking,
  EVENT_TYPES,
  slotsForType,
  slotTimeRange,
  RACE_SLOT_IDS,
  type BookingResult,
  type EventType,
  type Slot,
} from './data'

const HOURS = [9, 10, 11, 12, 13, 14, 15, 16]

// Вариант C: календарная сетка недели — слоты как ячейки, форма в модальном окне.
export default function VariantC() {
  const [eventType, setEventType] = useState<EventType | null>(EVENT_TYPES[0] ?? null)
  const [slot, setSlot] = useState<Slot | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [result, setResult] = useState<BookingResult | null>(null)

  const freeSlots = eventType ? slotsForType(eventType.id) : []

  const days = useMemo(() => {
    const map = new Map<string, Slot[]>()
    const today = new Date()
    for (let i = 1; i <= 7; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      const key = d.toISOString().slice(0, 10)
      map.set(key, [])
    }
    for (const s of freeSlots) {
      const key = s.start.slice(0, 10)
      const bucket = map.get(key)
      if (bucket) bucket.push(s)
    }
    return [...map.entries()]
  }, [freeSlots])

  const dayFmt = new Intl.DateTimeFormat('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
  const mdFmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', timeZone: 'UTC' })

  function book() {
    if (!slot) return
    setResult(createBooking(slot, { name, email, note }))
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-8 pb-24">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Запись на звонок</h1>
        <Button asChild variant="outline" size="sm">
          <Link to="/">На главную</Link>
        </Button>
      </header>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Тип события">
        {EVENT_TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={eventType?.id === t.id}
            className={
              'rounded-full border px-4 py-1.5 text-sm ' +
              (eventType?.id === t.id
                ? 'border-primary bg-primary text-primary-foreground'
                : 'hover:bg-muted')
            }
            onClick={() => {
              setEventType(t)
              setSlot(null)
              setResult(null)
            }}
          >
            {t.name} · {t.durationMin} мин
          </button>
        ))}
      </div>

      {freeSlots.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          На ближайшие 14 дней свободных слотов нет. Выберите другой тип события.
        </p>
      ) : (
        <div
          className="grid grid-cols-7 gap-2 overflow-x-auto"
          aria-label="Свободные слоты на неделю"
        >
          {days.map(([day, slots]) => (
            <div key={day} className="flex min-w-28 flex-col gap-1">
              <div className="pb-1 text-center text-xs font-semibold text-muted-foreground">
                {dayFmt.format(new Date(day + 'T00:00:00Z'))}
              </div>
              {slots.length === 0 && (
                <div className="rounded border border-dashed p-2 text-center text-xs text-muted-foreground">
                  —
                </div>
              )}
              {slots.map((s) => {
                const hour = Number(s.start.slice(11, 13))
                if (!HOURS.includes(hour)) return null
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={
                      'rounded border p-1 text-xs ' +
                      (slot?.id === s.id
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'hover:bg-muted') +
                      (RACE_SLOT_IDS.has(s.id) ? ' border-amber-400' : '')
                    }
                    onClick={() => {
                      setSlot(s)
                      setResult(null)
                    }}
                  >
                    {slotTimeRange(s)}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {slot && eventType && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Форма записи"
        >
          <div className="flex w-full max-w-md flex-col gap-3 rounded-xl bg-background p-6 shadow-xl">
            <h2 className="text-xl font-semibold">Запись · {eventType.name}</h2>
            <p className="rounded-lg bg-muted p-2 text-sm">
              {mdFmt.format(new Date(slot.start))}, {slotTimeRange(slot)} UTC
            </p>

            {result?.ok ? (
              <>
                <div className="flex flex-col gap-2 rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-900">
                  <p>
                    <strong>Вы записаны!</strong> Номер: {result.confirmation}
                  </p>
                  <p className="text-xs">Подтверждение отправлено на {result.email}</p>
                </div>
                <Button asChild variant="outline">
                  <Link to="/">На главную</Link>
                </Button>
              </>
            ) : (
              <>
                {result && !result.ok && (
                  <div
                    role="alert"
                    className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900"
                  >
                    <strong>Слот уже занял другой гость.</strong> Закройте окно и выберите другое
                    время.
                  </div>
                )}
                <label className="flex flex-col gap-1 text-sm">
                  Имя *
                  <input
                    className="rounded-md border p-2"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Email *
                  <input
                    type="email"
                    className="rounded-md border p-2"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Заметка
                  <textarea
                    className="rounded-md border p-2"
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </label>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSlot(null)}>
                    Отмена
                  </Button>
                  <Button onClick={book} disabled={!name.trim() || !email.trim()}>
                    Записаться
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
