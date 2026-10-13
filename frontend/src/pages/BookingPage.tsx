import type { BookingPublic, EventTypeGuest, Slot } from '@booking/client'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { guestApi } from '@/api/client'
import { ApiError } from '@/api/errors'
import { Button } from '@/components/ui/button'
import { dayKey, formatDay, formatInterval } from '@/lib/datetime'

const NO_SLOTS_TEXT = 'На ближайшие 14 дней свободных слотов нет.'
const SLOT_TAKEN_TEXT = 'Слот уже занят. Выберите другое время.'

const inputClass =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export default function BookingPage() {
  const [eventTypes, setEventTypes] = useState<EventTypeGuest[] | null>(null)
  const [typesError, setTypesError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<EventTypeGuest | null>(null)
  const [slots, setSlots] = useState<Slot[] | null>(null)
  const [slotsError, setSlotsError] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [slotTaken, setSlotTaken] = useState(false)
  const [booking, setBooking] = useState<BookingPublic | null>(null)

  useEffect(() => {
    guestApi
      .listEventTypes()
      .then(setEventTypes)
      .catch((error: unknown) => {
        setEventTypes([])
        setTypesError(
          error instanceof ApiError ? error.message : 'Не удалось загрузить типы событий',
        )
      })
  }, [])

  const loadSlots = (eventTypeId: number) => {
    setSlots(null)
    setSlotsError(null)
    guestApi
      .listSlots(eventTypeId)
      .then(setSlots)
      .catch((error: unknown) => {
        setSlots([])
        setSlotsError(error instanceof ApiError ? error.message : 'Не удалось загрузить слоты')
      })
  }

  const selectType = (type: EventTypeGuest) => {
    setSelectedType(type)
    setSelectedSlot(null)
    setSlotTaken(false)
    loadSlots(type.id)
  }

  const returnToSlots = () => {
    setSlotTaken(false)
    setSelectedSlot(null)
    if (selectedType) loadSlots(selectedType.id)
  }

  const submit = () => {
    if (!selectedType || !selectedSlot) return
    setSubmitting(true)
    setFormError(null)
    guestApi
      .createBooking({
        eventTypeId: selectedType.id,
        start: selectedSlot.start,
        name,
        email,
        note: note.trim() === '' ? undefined : note,
      })
      .then(setBooking)
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.code === 'slot_taken') {
          setSlotTaken(true)
          setSelectedSlot(null)
          return
        }
        setFormError(error instanceof ApiError ? error.message : 'Не удалось создать запись')
      })
      .finally(() => setSubmitting(false))
  }

  const slotGroups = useMemo(() => {
    if (!slots) return []
    const groups: Array<{ key: string; label: string; slots: Slot[] }> = []
    for (const slot of slots) {
      const key = dayKey(slot.start)
      const last = groups[groups.length - 1]
      if (last && last.key === key) {
        last.slots.push(slot)
      } else {
        groups.push({ key, label: formatDay(slot.start), slots: [slot] })
      }
    }
    return groups
  }, [slots])

  if (booking) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
        <section className="rounded-lg border border-green-600 bg-green-50 p-6 dark:bg-green-950">
          <h1 className="text-2xl font-bold text-green-800 dark:text-green-200">Вы записаны!</h1>
          <p className="mt-2 text-sm text-green-800 dark:text-green-200">
            Номер записи: <span data-testid="booking-id">{booking.id}</span>
          </p>
        </section>
        <Button asChild variant="outline" className="self-start">
          <Link to="/">На главную</Link>
        </Button>
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Запись на звонок</h1>
        <Button asChild variant="outline" size="sm">
          <Link to="/">На главную</Link>
        </Button>
      </header>

      {slotTaken && (
        <div
          role="alert"
          className="rounded-lg border border-amber-600 bg-amber-50 p-4 text-amber-900 dark:bg-amber-950 dark:text-amber-100"
        >
          <p>{SLOT_TAKEN_TEXT}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={returnToSlots}>
            ← Вернуться к слотам
          </Button>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <section className="flex flex-col gap-3" aria-label="Тип события">
          <h2 className="text-lg font-semibold">1. Тип события</h2>
          {typesError && <p className="text-sm text-destructive">{typesError}</p>}
          {eventTypes !== null && eventTypes.length === 0 && (
            <p className="text-sm text-muted-foreground">Типы событий пока не созданы.</p>
          )}
          {eventTypes === null && (
            <p className="text-sm text-muted-foreground">Загружаем типы событий…</p>
          )}
          <ul className="flex flex-col gap-2">
            {(eventTypes ?? []).map((type) => (
              <li key={type.id}>
                <button
                  type="button"
                  onClick={() => selectType(type)}
                  aria-pressed={selectedType?.id === type.id}
                  className={`w-full rounded-lg border p-3 text-left text-sm hover:bg-muted ${
                    selectedType?.id === type.id ? 'border-primary bg-muted' : ''
                  }`}
                >
                  <span className="font-medium">{type.name}</span>
                  <span className="block text-muted-foreground">{type.durationMinutes} мин.</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-3" aria-label="Свободные слоты">
          <h2 className="text-lg font-semibold">2. Свободное время</h2>
          {!selectedType && <p className="text-sm text-muted-foreground">Выберите тип события.</p>}
          {selectedType && slots === null && (
            <p className="text-sm text-muted-foreground">Загружаем слоты…</p>
          )}
          {slotsError && <p className="text-sm text-destructive">{slotsError}</p>}
          {slots !== null && slots.length === 0 && (
            <p className="text-sm text-muted-foreground">{NO_SLOTS_TEXT}</p>
          )}
          <div className="flex flex-col gap-4">
            {slotGroups.map((group) => (
              <div key={group.key} className="flex flex-col gap-2">
                <h3 className="text-sm font-medium text-muted-foreground">{group.label}</h3>
                <ul className="grid grid-cols-2 gap-2">
                  {group.slots.map((slot) => (
                    <li key={slot.start.toISOString()}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSlot(slot)
                          setFormError(null)
                        }}
                        aria-pressed={selectedSlot?.start.getTime() === slot.start.getTime()}
                        className={`rounded-md border px-2 py-1 text-sm hover:bg-muted ${
                          selectedSlot?.start.getTime() === slot.start.getTime()
                            ? 'border-primary bg-muted'
                            : ''
                        }`}
                      >
                        {formatInterval(slot.start, slot.end)}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3" aria-label="Контакты">
          <h2 className="text-lg font-semibold">3. Контакты</h2>
          {!selectedSlot && (
            <p className="text-sm text-muted-foreground">Выберите слот, чтобы записаться.</p>
          )}
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault()
              submit()
            }}
          >
            {selectedSlot && (
              <p className="text-sm text-muted-foreground">
                {selectedType?.name}, {formatInterval(selectedSlot.start, selectedSlot.end)}
              </p>
            )}
            <label className="flex flex-col gap-1 text-sm">
              Имя
              <input
                required
                className={inputClass}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Email
              <input
                required
                type="email"
                className={inputClass}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Заметка (необязательно)
              <textarea
                maxLength={500}
                rows={3}
                className={inputClass}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </label>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <Button type="submit" disabled={submitting || !selectedSlot}>
              Записаться
            </Button>
          </form>
        </section>
      </div>
    </main>
  )
}
