import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import {
  createBooking,
  EVENT_TYPES,
  slotDayLabel,
  slotDayLong,
  slotsForType,
  slotTimeRange,
  TAKEN_SLOT_IDS,
  type BookingResult,
  type EventType,
  type Slot,
} from './data'

// Вариант B (выбран): всё на одной странице — три колонки (тип → слот → форма).
// Правки из фидбека: слоты сгруппированы по датам; занятые — disabled.
export default function VariantB() {
  const [eventType, setEventType] = useState<EventType | null>(null)
  const [slot, setSlot] = useState<Slot | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [result, setResult] = useState<BookingResult | null>(null)

  const freeSlots = eventType ? slotsForType(eventType.id) : []

  const groupedSlots = useMemo(() => {
    const groups = new Map<string, Slot[]>()
    for (const s of freeSlots) {
      const key = s.start.slice(0, 10)
      const list = groups.get(key) ?? []
      list.push(s)
      groups.set(key, list)
    }
    return [...groups.entries()]
  }, [freeSlots])

  function book() {
    if (!slot) return
    setResult(createBooking(slot, { name, email, note }))
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 p-8 pb-24">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Запись на звонок</h1>
        <Button asChild variant="outline" size="sm">
          <Link to="/">На главную</Link>
        </Button>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-muted-foreground">1 · Тип события</h2>
          {EVENT_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={
                'rounded-lg border p-3 text-left ' +
                (eventType?.id === t.id ? 'border-primary bg-primary/10' : 'hover:bg-muted')
              }
              onClick={() => {
                setEventType(t)
                setSlot(null)
                setResult(null)
              }}
            >
              <span className="font-medium">{t.name}</span>
              <span className="text-muted-foreground"> · {t.durationMin} мин</span>
              <p className="text-xs text-muted-foreground">{t.description}</p>
            </button>
          ))}
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-muted-foreground">2 · Свободные слоты</h2>
          {!eventType && (
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Сначала выберите тип события.
            </p>
          )}
          {eventType && freeSlots.length === 0 && (
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              На ближайшие 14 дней свободных слотов нет.
            </p>
          )}
          {eventType &&
            groupedSlots.map(([day, daySlots]) => (
              <div key={day} className="flex flex-col gap-1">
                <h3 className="text-xs font-semibold uppercase text-muted-foreground">
                  {slotDayLabel(daySlots[0])}
                </h3>
                {daySlots.map((s) => {
                  const taken = TAKEN_SLOT_IDS.has(s.id)
                  return (
                    <button
                      key={s.id}
                      type="button"
                      disabled={taken}
                      className={
                        'rounded-lg border p-2 text-left text-sm ' +
                        (taken
                          ? 'cursor-not-allowed border-dashed bg-muted/50 text-muted-foreground opacity-60'
                          : slot?.id === s.id
                            ? 'border-primary bg-primary/10'
                            : 'hover:bg-muted')
                      }
                      onClick={() => {
                        if (taken) return
                        setSlot(s)
                        setResult(null)
                      }}
                    >
                      <span className="font-medium">{slotTimeRange(s)}</span>
                      {taken && <span className="ml-2 text-xs">занят</span>}
                    </button>
                  )
                })}
              </div>
            ))}
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-muted-foreground">3 · Контакты и запись</h2>
          {!slot && (
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Выберите слот, чтобы заполнить форму.
            </p>
          )}
          {slot && eventType && (
            <>
              <p className="rounded-lg bg-muted p-2 text-sm">
                {eventType.name} · {slotDayLong(slot)}, {slotTimeRange(slot)} UTC
              </p>
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

              {result && !result.ok && (
                <div
                  role="alert"
                  className="flex flex-col gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900"
                >
                  <p>
                    <strong>Слот уже занят.</strong> Выберите другое время.
                  </p>
                  <Button size="sm" variant="outline" onClick={() => setResult(null)}>
                    ← Вернуться к слотам
                  </Button>
                </div>
              )}
              {result?.ok && (
                <div className="flex flex-col gap-2 rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-900">
                  <p>
                    <strong>Вы записаны!</strong> {result.confirmation}
                  </p>
                  <p className="text-xs">Подтверждение отправлено на {result.email}</p>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/">На главную</Link>
                  </Button>
                </div>
              )}

              <Button onClick={book} disabled={!name.trim() || !email.trim()}>
                Записаться
              </Button>
            </>
          )}
        </section>
      </div>
    </main>
  )
}
