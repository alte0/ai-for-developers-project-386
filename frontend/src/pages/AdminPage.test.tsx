import type { BookingAdmin, EventTypeAdmin, Window as EventTypeWindow } from '@booking/client'
import { AvailabilityMode } from '@booking/client'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/errors'
import AdminPage from './AdminPage.tsx'

const listEventTypes = vi.fn()
const createEventType = vi.fn()
const updateEventType = vi.fn()
const deleteEventType = vi.fn()
const replaceSchedule = vi.fn()
const listWindows = vi.fn()
const createWindow = vi.fn()
const deleteWindow = vi.fn()
const listBookings = vi.fn()
const cancelBooking = vi.fn()

vi.mock('@/api/client', () => ({
  adminApi: {
    listEventTypes: () => listEventTypes(),
    createEventType: (input: unknown) => createEventType(input),
    updateEventType: (id: number, patch: unknown) => updateEventType(id, patch),
    deleteEventType: (id: number) => deleteEventType(id),
    replaceSchedule: (id: number, intervals: unknown) => replaceSchedule(id, intervals),
    listWindows: (id: number) => listWindows(id),
    createWindow: (id: number, input: unknown) => createWindow(id, input),
    deleteWindow: (id: number) => deleteWindow(id),
    listBookings: () => listBookings(),
    cancelBooking: (id: number) => cancelBooking(id),
  },
}))

const scheduleType: EventTypeAdmin = {
  id: 1,
  name: 'Воркшоп',
  durationMinutes: 45,
  availabilityMode: AvailabilityMode.Schedule,
}

const windowsType: EventTypeAdmin = {
  id: 2,
  name: 'Консультация',
  durationMinutes: 30,
  availabilityMode: AvailabilityMode.Windows,
}

const bookings: BookingAdmin[] = [
  {
    id: 7,
    eventTypeId: 1,
    start: new Date('2026-10-13T10:00:00Z'),
    end: new Date('2026-10-13T10:45:00Z'),
    name: 'Иван',
    email: 'ivan@example.com',
    note: 'По делу',
    createdAt: new Date('2026-10-01T12:00:00Z'),
  },
]

beforeEach(() => {
  listEventTypes.mockResolvedValue([scheduleType, windowsType])
  listBookings.mockResolvedValue(bookings)
  listWindows.mockResolvedValue([])
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

function renderAdminPage() {
  render(
    <MemoryRouter>
      <AdminPage />
    </MemoryRouter>,
  )
}

function typesSection() {
  return screen.getByLabelText('Типы событий')
}

describe('AdminPage (админка владельца)', () => {
  it('показывает типы событий и журнал записей', async () => {
    renderAdminPage()

    expect(await within(typesSection()).findByText('Воркшоп')).toBeInTheDocument()
    expect(screen.getByText('45 мин., расписание')).toBeInTheDocument()
    expect(screen.getByText('Консультация')).toBeInTheDocument()
    expect(screen.getByText('30 мин., ручные окна')).toBeInTheDocument()

    expect(await screen.findByText('Иван')).toBeInTheDocument()
    expect(screen.getByText('ivan@example.com')).toBeInTheDocument()
    expect(screen.getByText('По делу')).toBeInTheDocument()
  })

  it('создаёт тип события и обновляет список', async () => {
    createEventType.mockResolvedValue({ ...scheduleType, id: 3, name: 'Новый' })
    renderAdminPage()
    const user = userEvent.setup()

    await within(typesSection()).findByText('Воркшоп')
    await user.type(screen.getByLabelText('Название'), 'Новый')
    await user.clear(screen.getByLabelText('Длительность, мин.'))
    await user.type(screen.getByLabelText('Длительность, мин.'), '60')
    await user.selectOptions(screen.getByLabelText('Режим доступности'), 'windows')
    await user.click(screen.getByRole('button', { name: 'Создать' }))

    await waitFor(() => {
      expect(createEventType).toHaveBeenCalledWith({
        name: 'Новый',
        durationMinutes: 60,
        availabilityMode: 'windows',
      })
    })
  })

  it('показывает сообщение сервера при удалении типа с записями (409)', async () => {
    deleteEventType.mockRejectedValue(
      new ApiError('event_type_has_bookings', 'Нельзя удалить Тип события: на него есть Записи'),
    )
    renderAdminPage()
    const user = userEvent.setup()

    await within(typesSection()).findByText('Воркшоп')
    const card = within(typesSection()).getByText('Воркшоп').closest('li')
    expect(card).not.toBeNull()
    await user.click(within(card as HTMLElement).getByRole('button', { name: 'Удалить' }))

    expect(
      await within(card as HTMLElement).findByText(
        'Нельзя удалить Тип события: на него есть Записи',
      ),
    ).toBeInTheDocument()
    expect(deleteEventType).toHaveBeenCalledWith(1)
  })

  it('переименовывает тип через PATCH', async () => {
    updateEventType.mockResolvedValue({ ...scheduleType, name: 'Воркшоп 2.0' })
    renderAdminPage()
    const user = userEvent.setup()

    await within(typesSection()).findByText('Воркшоп')
    const card = within(typesSection()).getByText('Воркшоп').closest('li')
    await user.click(within(card as HTMLElement).getByRole('button', { name: 'Изменить' }))
    const nameInput = within(card as HTMLElement).getByLabelText('Название')
    await user.clear(nameInput)
    await user.type(nameInput, 'Воркшоп 2.0')
    await user.click(within(card as HTMLElement).getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => {
      expect(updateEventType).toHaveBeenCalledWith(1, { name: 'Воркшоп 2.0', durationMinutes: 45 })
    })
  })

  it('сохраняет расписание через PUT (интервал в минутах UTC)', async () => {
    replaceSchedule.mockResolvedValue(undefined)
    renderAdminPage()
    const user = userEvent.setup()

    await within(typesSection()).findByText('Воркшоп')
    const card = within(typesSection()).getByText('Воркшоп').closest('li')
    await user.click(within(card as HTMLElement).getByRole('button', { name: 'Доступное время' }))
    await user.click(
      within(card as HTMLElement).getByRole('button', { name: 'Пн, добавить интервал' }),
    )

    const start = within(card as HTMLElement).getByLabelText('Пн, интервал 1, начало')
    const end = within(card as HTMLElement).getByLabelText('Пн, интервал 1, конец')
    await user.clear(start)
    await user.type(start, '10:00')
    await user.clear(end)
    await user.type(end, '12:00')
    await user.click(
      within(card as HTMLElement).getByRole('button', { name: 'Сохранить расписание' }),
    )

    await waitFor(() => {
      expect(replaceSchedule).toHaveBeenCalledWith(1, [
        { weekday: 0, startMinute: 600, endMinute: 720 },
      ])
    })
    expect(
      await within(card as HTMLElement).findByText('Расписание сохранено.'),
    ).toBeInTheDocument()
  })

  it('показывает ошибку при некорректном интервале расписания', async () => {
    renderAdminPage()
    const user = userEvent.setup()

    await within(typesSection()).findByText('Воркшоп')
    const card = within(typesSection()).getByText('Воркшоп').closest('li')
    await user.click(within(card as HTMLElement).getByRole('button', { name: 'Доступное время' }))
    await user.click(
      within(card as HTMLElement).getByRole('button', { name: 'Пн, добавить интервал' }),
    )

    const start = within(card as HTMLElement).getByLabelText('Пн, интервал 1, начало')
    const end = within(card as HTMLElement).getByLabelText('Пн, интервал 1, конец')
    await user.clear(start)
    await user.type(start, '12:00')
    await user.clear(end)
    await user.type(end, '10:00')
    await user.click(
      within(card as HTMLElement).getByRole('button', { name: 'Сохранить расписание' }),
    )

    expect(
      await within(card as HTMLElement).findByText(
        'Проверьте интервалы: начало должно быть раньше конца, формат ЧЧ:ММ.',
      ),
    ).toBeInTheDocument()
    expect(replaceSchedule).not.toHaveBeenCalled()
  })

  it('создаёт и удаляет ручные окна', async () => {
    const created: EventTypeWindow = {
      id: 9,
      start: new Date('2026-10-14T10:00:00Z'),
      end: new Date('2026-10-14T11:00:00Z'),
    }
    listWindows.mockResolvedValue([])
    createWindow.mockResolvedValue(created)
    deleteWindow.mockResolvedValue(undefined)
    renderAdminPage()
    const user = userEvent.setup()

    await within(typesSection()).findByText('Консультация')
    const card = within(typesSection()).getByText('Консультация').closest('li')
    await user.click(within(card as HTMLElement).getByRole('button', { name: 'Доступное время' }))
    expect(listWindows).toHaveBeenCalledWith(2)
    expect(await within(card as HTMLElement).findByText('Окон пока нет.')).toBeInTheDocument()

    await user.type(within(card as HTMLElement).getByLabelText('Начало (UTC)'), '2026-10-14T10:00')
    await user.type(within(card as HTMLElement).getByLabelText('Конец (UTC)'), '2026-10-14T11:00')
    await user.click(within(card as HTMLElement).getByRole('button', { name: 'Добавить окно' }))

    await waitFor(() => {
      expect(createWindow).toHaveBeenCalledWith(2, {
        start: new Date('2026-10-14T10:00:00Z'),
        end: new Date('2026-10-14T11:00:00Z'),
      })
    })
    expect(await within(card as HTMLElement).findByText(/13:00 – 14:00/)).toBeInTheDocument()

    await user.click(within(card as HTMLElement).getByRole('button', { name: 'Удалить окно' }))
    await waitFor(() => {
      expect(deleteWindow).toHaveBeenCalledWith(9)
    })
    expect(await within(card as HTMLElement).findByText('Окон пока нет.')).toBeInTheDocument()
  })

  it('отменяет запись и обновляет журнал', async () => {
    cancelBooking.mockResolvedValue(undefined)
    renderAdminPage()
    const user = userEvent.setup()

    await screen.findByText('Иван')
    await user.click(screen.getByRole('button', { name: 'Отменить' }))

    await waitFor(() => {
      expect(cancelBooking).toHaveBeenCalledWith(7)
    })
    expect(listBookings).toHaveBeenCalledTimes(2)
  })

  it('показывает сообщение сервера при ошибке отмены', async () => {
    cancelBooking.mockRejectedValue(new ApiError('not_found', 'Запись не найдена'))
    renderAdminPage()
    const user = userEvent.setup()

    await screen.findByText('Иван')
    await user.click(screen.getByRole('button', { name: 'Отменить' }))

    expect(await screen.findByText('Запись не найдена')).toBeInTheDocument()
  })
})
