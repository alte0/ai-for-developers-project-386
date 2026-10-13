import type {
  BookingAdmin,
  EventTypeAdmin,
  ScheduleInterval,
  Window as EventTypeWindow,
} from '@booking/client'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { adminApi } from '@/api/client'
import { ApiError } from '@/api/errors'
import { Button } from '@/components/ui/button'
import {
  WEEKDAY_LABELS,
  formatDay,
  formatInterval,
  formatTime,
  parseMinuteOfDay,
} from '@/lib/datetime'

const inputClass =
  'rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

type ScheduleDraft = Array<Array<{ start: string; end: string }>>

function emptyDraft(): ScheduleDraft {
  return WEEKDAY_LABELS.map(() => [])
}

function apiMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

export default function AdminPage() {
  const [types, setTypes] = useState<EventTypeAdmin[]>([])
  const [typesError, setTypesError] = useState<string | null>(null)
  const [bookings, setBookings] = useState<BookingAdmin[]>([])
  const [bookingsError, setBookingsError] = useState<string | null>(null)

  const [newName, setNewName] = useState('')
  const [newDuration, setNewDuration] = useState('30')
  const [newMode, setNewMode] = useState<'schedule' | 'windows'>('schedule')
  const [createError, setCreateError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editDuration, setEditDuration] = useState('')

  const [editorId, setEditorId] = useState<number | null>(null)
  const [scheduleDraft, setScheduleDraft] = useState<ScheduleDraft>(emptyDraft)
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const [scheduleSaved, setScheduleSaved] = useState(false)
  const [windows, setWindows] = useState<EventTypeWindow[] | null>(null)
  const [windowStart, setWindowStart] = useState('')
  const [windowEnd, setWindowEnd] = useState('')
  const [windowError, setWindowError] = useState<string | null>(null)

  const [typeErrors, setTypeErrors] = useState<Record<number, string>>({})
  const [bookingErrors, setBookingErrors] = useState<Record<number, string>>({})

  const loadTypes = () => {
    adminApi
      .listEventTypes()
      .then(setTypes)
      .catch((error: unknown) =>
        setTypesError(apiMessage(error, 'Не удалось загрузить типы событий')),
      )
  }

  const loadBookings = () => {
    adminApi
      .listBookings()
      .then(setBookings)
      .catch((error: unknown) => setBookingsError(apiMessage(error, 'Не удалось загрузить записи')))
  }

  useEffect(() => {
    loadTypes()
    loadBookings()
  }, [])

  const createEventType = (event: React.FormEvent) => {
    event.preventDefault()
    setCreateError(null)
    const duration = Number(newDuration)
    adminApi
      .createEventType({ name: newName, durationMinutes: duration, availabilityMode: newMode })
      .then(() => {
        setNewName('')
        setNewDuration('30')
        loadTypes()
      })
      .catch((error: unknown) =>
        setCreateError(apiMessage(error, 'Не удалось создать тип события')),
      )
  }

  const startEdit = (type: EventTypeAdmin) => {
    setEditingId(type.id)
    setEditName(type.name)
    setEditDuration(String(type.durationMinutes))
    setEditorId(null)
  }

  const saveEdit = (event: React.FormEvent) => {
    event.preventDefault()
    if (editingId === null) return
    const id = editingId
    adminApi
      .updateEventType(id, { name: editName, durationMinutes: Number(editDuration) })
      .then(() => {
        setEditingId(null)
        loadTypes()
      })
      .catch((error: unknown) =>
        setTypeErrors((prev) => ({ ...prev, [id]: apiMessage(error, 'Не удалось сохранить тип') })),
      )
  }

  const deleteEventType = (id: number) => {
    setTypeErrors((prev) => ({ ...prev, [id]: '' }))
    adminApi
      .deleteEventType(id)
      .then(() => {
        if (editorId === id) setEditorId(null)
        loadTypes()
      })
      .catch((error: unknown) =>
        setTypeErrors((prev) => ({
          ...prev,
          [id]: apiMessage(error, 'Не удалось удалить тип события'),
        })),
      )
  }

  const toggleEditor = (type: EventTypeAdmin) => {
    if (editorId === type.id) {
      setEditorId(null)
      return
    }
    setEditorId(type.id)
    setScheduleDraft(emptyDraft())
    setScheduleError(null)
    setScheduleSaved(false)
    setWindowError(null)
    setWindows(null)
    setWindowStart('')
    setWindowEnd('')
    if (type.availabilityMode === 'windows') {
      adminApi
        .listWindows(type.id)
        .then(setWindows)
        .catch((error: unknown) => {
          setWindows([])
          setWindowError(apiMessage(error, 'Не удалось загрузить окна'))
        })
    }
  }

  const addInterval = (weekday: number) => {
    setScheduleDraft((prev) =>
      prev.map((day, index) => (index === weekday ? [...day, { start: '', end: '' }] : day)),
    )
  }

  const changeInterval = (
    weekday: number,
    index: number,
    field: 'start' | 'end',
    value: string,
  ) => {
    setScheduleDraft((prev) =>
      prev.map((day, w) =>
        w === weekday
          ? day.map((interval, i) => (i === index ? { ...interval, [field]: value } : interval))
          : day,
      ),
    )
    setScheduleSaved(false)
  }

  const removeInterval = (weekday: number, index: number) => {
    setScheduleDraft((prev) =>
      prev.map((day, w) => (w === weekday ? day.filter((_, i) => i !== index) : day)),
    )
    setScheduleSaved(false)
  }

  const saveSchedule = (id: number) => {
    const intervals: ScheduleInterval[] = []
    for (let weekday = 0; weekday < scheduleDraft.length; weekday += 1) {
      for (const interval of scheduleDraft[weekday]) {
        const startMinute = parseMinuteOfDay(interval.start)
        const endMinute = parseMinuteOfDay(interval.end)
        if (Number.isNaN(startMinute) || Number.isNaN(endMinute) || startMinute >= endMinute) {
          setScheduleError('Проверьте интервалы: начало должно быть раньше конца, формат ЧЧ:ММ.')
          return
        }
        intervals.push({ weekday, startMinute, endMinute })
      }
    }
    setScheduleError(null)
    adminApi
      .replaceSchedule(id, intervals)
      .then(() => setScheduleSaved(true))
      .catch((error: unknown) =>
        setScheduleError(apiMessage(error, 'Не удалось сохранить расписание')),
      )
  }

  const createWindow = (id: number, event: React.FormEvent) => {
    event.preventDefault()
    setWindowError(null)
    adminApi
      .createWindow(id, {
        start: new Date(`${windowStart}:00Z`),
        end: new Date(`${windowEnd}:00Z`),
      })
      .then((window) => {
        setWindows((prev) => [...(prev ?? []), window])
        setWindowStart('')
        setWindowEnd('')
      })
      .catch((error: unknown) => setWindowError(apiMessage(error, 'Не удалось создать окно')))
  }

  const deleteWindow = (windowId: number) => {
    setWindowError(null)
    adminApi
      .deleteWindow(windowId)
      .then(() => setWindows((prev) => (prev ?? []).filter((window) => window.id !== windowId)))
      .catch((error: unknown) => setWindowError(apiMessage(error, 'Не удалось удалить окно')))
  }

  const cancelBooking = (id: number) => {
    setBookingErrors((prev) => ({ ...prev, [id]: '' }))
    adminApi
      .cancelBooking(id)
      .then(loadBookings)
      .catch((error: unknown) =>
        setBookingErrors((prev) => ({
          ...prev,
          [id]: apiMessage(error, 'Не удалось отменить запись'),
        })),
      )
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Админка владельца</h1>
        <Button asChild variant="outline" size="sm">
          <Link to="/">На главную</Link>
        </Button>
      </header>

      <section className="flex flex-col gap-4" aria-label="Типы событий">
        <h2 className="text-2xl font-semibold">Типы событий</h2>
        {typesError && <p className="text-sm text-destructive">{typesError}</p>}

        <form
          onSubmit={createEventType}
          className="flex flex-wrap items-end gap-3 rounded-lg border p-4"
        >
          <label className="flex flex-col gap-1 text-sm">
            Название
            <input
              required
              className={`${inputClass} w-48`}
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Длительность, мин.
            <input
              required
              type="number"
              min={15}
              max={480}
              className={`${inputClass} w-28`}
              value={newDuration}
              onChange={(event) => setNewDuration(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Режим доступности
            <select
              className={inputClass}
              value={newMode}
              onChange={(event) =>
                setNewMode(event.target.value === 'windows' ? 'windows' : 'schedule')
              }
            >
              <option value="schedule">расписание</option>
              <option value="windows">ручные окна</option>
            </select>
          </label>
          <Button type="submit" size="sm">
            Создать
          </Button>
          {createError && <p className="w-full text-sm text-destructive">{createError}</p>}
        </form>

        {types.length === 0 && !typesError && (
          <p className="text-sm text-muted-foreground">Типы событий пока не созданы.</p>
        )}
        <ul className="flex flex-col gap-3">
          {types.map((type) => (
            <li key={type.id} className="flex flex-col gap-2 rounded-lg border p-4">
              {editingId === type.id ? (
                <form onSubmit={saveEdit} className="flex flex-wrap items-end gap-3">
                  <label className="flex flex-col gap-1 text-sm">
                    Название
                    <input
                      required
                      className={`${inputClass} w-48`}
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    Длительность, мин.
                    <input
                      required
                      type="number"
                      min={15}
                      max={480}
                      className={`${inputClass} w-28`}
                      value={editDuration}
                      onChange={(event) => setEditDuration(event.target.value)}
                    />
                  </label>
                  <Button type="submit" size="sm">
                    Сохранить
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingId(null)}
                  >
                    Отмена
                  </Button>
                </form>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{type.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {type.durationMinutes} мин.,{' '}
                      {type.availabilityMode === 'windows' ? 'ручные окна' : 'расписание'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => startEdit(type)}>
                      Изменить
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toggleEditor(type)}>
                      {editorId === type.id ? 'Скрыть редактор' : 'Доступное время'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => deleteEventType(type.id)}>
                      Удалить
                    </Button>
                  </div>
                </div>
              )}
              {typeErrors[type.id] && (
                <p className="text-sm text-destructive">{typeErrors[type.id]}</p>
              )}

              {editorId === type.id && type.availabilityMode === 'schedule' && (
                <div
                  className="flex flex-col gap-3 rounded-md border p-3"
                  aria-label="Редактор расписания"
                >
                  <p className="text-sm text-muted-foreground">
                    Сохранение заменяет всю неделю целиком (время в UTC).
                  </p>
                  <table className="w-full text-sm">
                    <tbody>
                      {WEEKDAY_LABELS.map((label, weekday) => (
                        <tr key={label} className="border-b last:border-b-0">
                          <th className="w-16 py-2 text-left font-medium">{label}</th>
                          <td className="py-2">
                            <div className="flex flex-wrap items-center gap-2">
                              {scheduleDraft[weekday].map((interval, index) => (
                                <span key={index} className="inline-flex items-center gap-1">
                                  <input
                                    type="time"
                                    className={inputClass}
                                    value={interval.start}
                                    onChange={(event) =>
                                      changeInterval(weekday, index, 'start', event.target.value)
                                    }
                                    aria-label={`${label}, интервал ${index + 1}, начало`}
                                  />
                                  <span>–</span>
                                  <input
                                    type="time"
                                    className={inputClass}
                                    value={interval.end}
                                    onChange={(event) =>
                                      changeInterval(weekday, index, 'end', event.target.value)
                                    }
                                    aria-label={`${label}, интервал ${index + 1}, конец`}
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => removeInterval(weekday, index)}
                                    aria-label={`${label}, удалить интервал ${index + 1}`}
                                  >
                                    ×
                                  </Button>
                                </span>
                              ))}
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => addInterval(weekday)}
                                aria-label={`${label}, добавить интервал`}
                              >
                                + Интервал
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {scheduleError && <p className="text-sm text-destructive">{scheduleError}</p>}
                  {scheduleSaved && (
                    <p className="text-sm text-green-700 dark:text-green-400">
                      Расписание сохранено.
                    </p>
                  )}
                  <Button size="sm" className="self-start" onClick={() => saveSchedule(type.id)}>
                    Сохранить расписание
                  </Button>
                </div>
              )}

              {editorId === type.id && type.availabilityMode === 'windows' && (
                <div
                  className="flex flex-col gap-3 rounded-md border p-3"
                  aria-label="Редактор окон"
                >
                  <p className="text-sm text-muted-foreground">
                    Абсолютные интервалы в UTC; создать можно только в будущем.
                  </p>
                  {windows === null && (
                    <p className="text-sm text-muted-foreground">Загружаем окна…</p>
                  )}
                  <ul className="flex flex-col gap-2">
                    {(windows ?? []).map((window) => (
                      <li
                        key={window.id}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span>
                          {formatDay(window.start)}, {formatInterval(window.start, window.end)}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteWindow(window.id)}
                          aria-label="Удалить окно"
                        >
                          Удалить
                        </Button>
                      </li>
                    ))}
                  </ul>
                  {windows !== null && windows.length === 0 && (
                    <p className="text-sm text-muted-foreground">Окон пока нет.</p>
                  )}
                  <form
                    onSubmit={(event) => createWindow(type.id, event)}
                    className="flex flex-wrap items-end gap-3"
                  >
                    <label className="flex flex-col gap-1 text-sm">
                      Начало (UTC)
                      <input
                        required
                        type="datetime-local"
                        className={inputClass}
                        value={windowStart}
                        onChange={(event) => setWindowStart(event.target.value)}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      Конец (UTC)
                      <input
                        required
                        type="datetime-local"
                        className={inputClass}
                        value={windowEnd}
                        onChange={(event) => setWindowEnd(event.target.value)}
                      />
                    </label>
                    <Button type="submit" size="sm">
                      Добавить окно
                    </Button>
                  </form>
                  {windowError && <p className="text-sm text-destructive">{windowError}</p>}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4" aria-label="Записи">
        <h2 className="text-2xl font-semibold">Записи</h2>
        {bookingsError && <p className="text-sm text-destructive">{bookingsError}</p>}
        {bookings.length === 0 && !bookingsError && (
          <p className="text-sm text-muted-foreground">Записей пока нет.</p>
        )}
        {bookings.length > 0 && (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="p-3 font-medium">№</th>
                  <th className="p-3 font-medium">Тип</th>
                  <th className="p-3 font-medium">Начало</th>
                  <th className="p-3 font-medium">Клиент</th>
                  <th className="p-3 font-medium">Email</th>
                  <th className="p-3 font-medium">Заметка</th>
                  <th className="p-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => {
                  const type = types.find((item) => item.id === booking.eventTypeId)
                  return (
                    <tr key={booking.id} className="border-b last:border-b-0">
                      <td className="p-3">{booking.id}</td>
                      <td className="p-3">{type?.name ?? `#${booking.eventTypeId}`}</td>
                      <td className="p-3">
                        {formatDay(booking.start)}, {formatTime(booking.start)} –{' '}
                        {formatTime(booking.end)}
                      </td>
                      <td className="p-3">{booking.name}</td>
                      <td className="p-3">{booking.email}</td>
                      <td className="p-3">{booking.note ?? '—'}</td>
                      <td className="p-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cancelBooking(booking.id)}
                        >
                          Отменить
                        </Button>
                        {bookingErrors[booking.id] && (
                          <p className="mt-1 text-xs text-destructive">
                            {bookingErrors[booking.id]}
                          </p>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}
