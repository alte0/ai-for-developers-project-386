import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import {
  createBooking,
  EVENT_TYPES,
  slotDayLabel,
  slotDayLong,
  slotsForType,
  slotTimeRange,
  POISONED_SLOT_IDS,
  type BookingResult,
  type EventType,
  type Slot,
} from './data'

// Вариант A: пошаговый мастер — один выбор на экран, шаги 1..3 + подтверждение.
export default function VariantA() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [eventType, setEventType] = useState<EventType | null>(null)
  const [slot, setSlot] = useState<Slot | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [result, setResult] = useState<BookingResult | null>(null)

  const freeSlots = eventType ? slotsForType(eventType.id) : []

  function book() {
    if (!slot) return
    const res = createBooking(slot, { name, email, note })
    setResult(res)
    if (res.ok) setStep(4)
  }

  function backToSlots() {
    setResult(null)
    setStep(2)
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 p-8 pb-24">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Запись на звонок</h1>
        <Button asChild variant="outline" size="sm">
          <Link to="/">На главную</Link>
        </Button>
      </header>

      <ol className="flex gap-2 text-sm" aria-label="Шаги">
        {['Тип', 'Время', 'Контакты', 'Готово'].map((label, i) => {
          const n = (i + 1) as 1 | 2 | 3 | 4
          return (
            <li
              key={label}
              className={
                'rounded-full px-3 py-1 ' +
                (step === n
                  ? 'bg-primary text-primary-foreground'
                  : step > n
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-muted/40 text-muted-foreground')
              }
            >
              {i + 1}. {label}
            </li>
          )
        })}
      </ol>

      {step === 1 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">Шаг 1 — тип события</h2>
          {EVENT_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              className="rounded-lg border p-4 text-left hover:bg-muted"
              onClick={() => {
                setEventType(t)
                setSlot(null)
                setResult(null)
                setStep(2)
              }}
            >
              <span className="font-semibold">{t.name}</span>
              <span className="text-muted-foreground"> · {t.durationMin} мин</span>
              <p className="text-sm text-muted-foreground">{t.description}</p>
            </button>
          ))}
        </section>
      )}

      {step === 2 && eventType && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">
            Шаг 2 — время · {eventType.name} ({eventType.durationMin} мин)
          </h2>
          {freeSlots.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
              На ближайшие 14 дней свободных слотов нет. Выберите другой тип события.
            </p>
          ) : (
            <ul className="grid gap-2">
              {freeSlots.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className={
                      'w-full rounded-lg border p-3 text-left hover:bg-muted ' +
                      (slot?.id === s.id ? 'border-primary bg-primary/10' : '')
                    }
                    onClick={() => {
                      setSlot(s)
                      setResult(null)
                      setStep(3)
                    }}
                  >
                    <span className="font-medium">{slotDayLabel(s)}</span>
                    <span className="text-muted-foreground"> · {slotTimeRange(s)} UTC</span>
                    {POISONED_SLOT_IDS.has(s.id) && (
                      <span className="ml-2 text-xs text-amber-600">(занят)</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Button variant="outline" onClick={() => setStep(1)}>
            ← Назад к типам
          </Button>
        </section>
      )}

      {step === 3 && slot && eventType && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">Шаг 3 — ваши контакты</h2>
          <p className="rounded-lg bg-muted p-3 text-sm">
            {eventType.name} · {slotDayLong(slot)}, {slotTimeRange(slot)} UTC
          </p>
          <label className="flex flex-col gap-1 text-sm">
            Имя *
            <input
              className="rounded-md border p-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Email *
            <input
              type="email"
              className="rounded-md border p-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Заметка (необязательно)
            <textarea
              className="rounded-md border p-2"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>

          {result && !result.ok && (
            <div
              role="alert"
              className="flex flex-col gap-2 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900"
            >
              <p>
                <strong>Слот уже занят.</strong> {result.message}
              </p>
              <Button size="sm" onClick={backToSlots}>
                ← Выбрать другое время
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(2)}>
              ← Назад
            </Button>
            <Button onClick={book} disabled={!name.trim() || !email.trim()}>
              Записаться
            </Button>
          </div>
        </section>
      )}

      {step === 4 && result?.ok && slot && eventType && (
        <section className="flex flex-col gap-3 rounded-lg border border-green-300 bg-green-50 p-6">
          <h2 className="text-xl font-semibold text-green-900">Вы записаны!</h2>
          <p className="text-green-900">
            {eventType.name} · {slotDayLong(slot)}, {slotTimeRange(slot)} UTC
          </p>
          <p className="text-sm text-green-800">
            Номер записи: <strong>{result.confirmation}</strong>
          </p>
          <p className="text-sm text-green-800">Подтверждение отправлено на {result.email}</p>
          <Button asChild variant="outline">
            <Link to="/">На главную</Link>
          </Button>
        </section>
      )}
    </main>
  )
}
