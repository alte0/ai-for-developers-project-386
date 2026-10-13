import type { BookingPublic, EventTypeGuest, Slot } from '@booking/client'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/errors'
import BookingPage from './BookingPage.tsx'

const listEventTypes = vi.fn()
const listSlots = vi.fn()
const createBooking = vi.fn()

vi.mock('@/api/client', () => ({
  guestApi: {
    listEventTypes: () => listEventTypes(),
    listSlots: (eventTypeId: number) => listSlots(eventTypeId),
    createBooking: (input: unknown) => createBooking(input),
  },
}))

const types: EventTypeGuest[] = [
  { id: 1, name: 'Воркшоп', durationMinutes: 45 },
  { id: 2, name: 'Консультация', durationMinutes: 30 },
]

function slot(start: string, end: string): Slot {
  return { start: new Date(start), end: new Date(end) }
}

const slots: Slot[] = [
  slot('2026-10-13T10:00:00Z', '2026-10-13T10:45:00Z'),
  slot('2026-10-13T11:00:00Z', '2026-10-13T11:45:00Z'),
  slot('2026-10-14T09:00:00Z', '2026-10-14T09:45:00Z'),
]

beforeEach(() => {
  listEventTypes.mockResolvedValue(types)
  listSlots.mockResolvedValue(slots)
  createBooking.mockReset()
})

afterEach(() => {
  cleanup()
  listEventTypes.mockReset()
  listSlots.mockReset()
})

function renderBookingPage() {
  render(
    <MemoryRouter>
      <BookingPage />
    </MemoryRouter>,
  )
}

describe('BookingPage (запись гостя)', () => {
  it('показывает типы событий после загрузки', async () => {
    renderBookingPage()

    expect(await screen.findByText('Воркшоп')).toBeInTheDocument()
    expect(screen.getByText('45 мин.')).toBeInTheDocument()
    expect(screen.getByText('Консультация')).toBeInTheDocument()
  })

  it('при выборе типа показывает слоты, сгруппированные по датам', async () => {
    renderBookingPage()
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: /Воркшоп/ }))

    expect(listSlots).toHaveBeenCalledWith(1)
    expect(await screen.findByText('вт, 13 октября')).toBeInTheDocument()
    expect(screen.getByText('ср, 14 октября')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '13:00 – 13:45' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '14:00 – 14:45' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '12:00 – 12:45' })).toBeInTheDocument()
  })

  it('показывает пустое состояние, когда слотов нет', async () => {
    listSlots.mockResolvedValue([])
    renderBookingPage()
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: /Воркшоп/ }))

    expect(
      await screen.findByText('На ближайшие 14 дней свободных слотов нет.'),
    ).toBeInTheDocument()
  })

  it('создаёт запись и показывает подтверждение с номером', async () => {
    const booking: BookingPublic = {
      id: 42,
      eventTypeId: 1,
      start: new Date('2026-10-13T10:00:00Z'),
      end: new Date('2026-10-13T10:45:00Z'),
    }
    createBooking.mockResolvedValue(booking)
    renderBookingPage()
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: /Воркшоп/ }))
    await user.click(await screen.findByRole('button', { name: '13:00 – 13:45' }))
    await user.type(screen.getByLabelText('Имя'), 'Иван')
    await user.type(screen.getByLabelText('Email'), 'ivan@example.com')
    await user.type(screen.getByLabelText('Заметка (необязательно)'), 'По делу')
    await user.click(screen.getByRole('button', { name: 'Записаться' }))

    expect(await screen.findByText('Вы записаны!')).toBeInTheDocument()
    expect(screen.getByTestId('booking-id')).toHaveTextContent('42')
    expect(createBooking).toHaveBeenCalledWith({
      eventTypeId: 1,
      start: new Date('2026-10-13T10:00:00Z'),
      name: 'Иван',
      email: 'ivan@example.com',
      note: 'По делу',
    })
    expect(screen.getByRole('link', { name: 'На главную' })).toHaveAttribute('href', '/')
  })

  it('при 409 slot_taken показывает alert и возвращает к слотам без потери формы', async () => {
    createBooking.mockRejectedValue(
      new ApiError('slot_taken', 'Слот уже занят, выберите другое время'),
    )
    renderBookingPage()
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: /Воркшоп/ }))
    await user.click(await screen.findByRole('button', { name: '13:00 – 13:45' }))
    await user.type(screen.getByLabelText('Имя'), 'Иван')
    await user.type(screen.getByLabelText('Email'), 'ivan@example.com')
    await user.click(screen.getByRole('button', { name: 'Записаться' }))

    const alert = await screen.findByRole('alert')
    expect(within(alert).getByText('Слот уже занят. Выберите другое время.')).toBeInTheDocument()

    const callsBefore = listSlots.mock.calls.length
    await user.click(within(alert).getByRole('button', { name: '← Вернуться к слотам' }))

    await waitFor(() => {
      expect(listSlots.mock.calls.length).toBe(callsBefore + 1)
    })
    expect(screen.getByLabelText('Имя')).toHaveValue('Иван')
    expect(screen.getByLabelText('Email')).toHaveValue('ivan@example.com')
  })

  it('показывает сообщение сервера при ошибке валидации контакта', async () => {
    createBooking.mockRejectedValue(
      new ApiError('invalid_contact', 'Проверьте имя, email и заметку'),
    )
    renderBookingPage()
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: /Воркшоп/ }))
    await user.click(await screen.findByRole('button', { name: '13:00 – 13:45' }))
    await user.type(screen.getByLabelText('Имя'), 'Иван')
    await user.type(screen.getByLabelText('Email'), 'ivan@example.com')
    await user.click(screen.getByRole('button', { name: 'Записаться' }))

    expect(await screen.findByText('Проверьте имя, email и заметку')).toBeInTheDocument()
    expect(screen.queryByText('Вы записаны!')).not.toBeInTheDocument()
  })

  it('показывает сообщение, если типы событий не загрузились', async () => {
    listEventTypes.mockRejectedValue(new ApiError('request_failed', 'network down'))
    renderBookingPage()

    expect(await screen.findByText('network down')).toBeInTheDocument()
  })
})
