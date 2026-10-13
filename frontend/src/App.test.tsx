import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'

vi.mock('@/api/client', () => ({
  createBookingApiClient: () => ({
    serviceClient: { getHealth: () => Promise.resolve({ status: 'ok' }) },
  }),
  guestApi: {
    listEventTypes: () => Promise.resolve([]),
    listSlots: () => Promise.resolve([]),
    createBooking: () => Promise.reject(new Error('unused')),
  },
  adminApi: {
    listEventTypes: () => Promise.resolve([]),
    listBookings: () => Promise.resolve([]),
  },
}))

afterEach(() => {
  cleanup()
  window.history.pushState({}, '', '/')
})

function renderAt(path: string) {
  window.history.pushState({}, '', path)
  render(<App />)
}

describe('App (роутинг Главной страницы)', () => {
  it('маршрут / показывает Главную страницу', () => {
    renderAt('/')

    expect(screen.getByRole('heading', { level: 1, name: 'Календарь звонков' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Записаться' })).toHaveAttribute('href', '/booking')
  })

  it('маршрут /booking показывает страницу записи', () => {
    renderAt('/booking')

    expect(screen.getByRole('heading', { level: 1, name: 'Запись на звонок' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'На главную' })[0]).toHaveAttribute('href', '/')
  })

  it('маршрут /admin открывается напрямую по URL', async () => {
    renderAt('/admin')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Админка владельца' }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'На главную' })[0]).toHaveAttribute('href', '/')
  })

  it('клик по «Записаться» ведёт с Главной на запись', async () => {
    renderAt('/')
    const user = userEvent.setup()

    await user.click(screen.getByRole('link', { name: 'Записаться' }))

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Запись на звонок' }),
      ).toBeInTheDocument()
    })
  })

  it('клик по «Перейти к записи» ведёт с Главной на запись', async () => {
    renderAt('/')
    const user = userEvent.setup()

    await user.click(screen.getByRole('link', { name: 'Перейти к записи' }))

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Запись на звонок' }),
      ).toBeInTheDocument()
    })
  })
})
