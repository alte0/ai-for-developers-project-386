import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import HomePage from './HomePage.tsx'

afterEach(() => {
  cleanup()
})

function renderHomePage() {
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  )
}

describe('HomePage (Главная страница)', () => {
  it('показывает заголовок и описание сервиса', () => {
    renderHomePage()

    expect(screen.getByRole('heading', { level: 1, name: 'Календарь звонков' })).toBeInTheDocument()
    expect(
      screen.getByText(
        'Сервис бронирования календаря: владелец публикует доступное время, гость выбирает свободный слот и записывается на звонок.',
      ),
    ).toBeInTheDocument()
  })

  it('показывает раздел о сервисе', () => {
    renderHomePage()

    expect(screen.getByRole('heading', { level: 2, name: 'О сервисе' })).toBeInTheDocument()
    expect(
      screen.getByText(
        'Один календарь вместо переписки: типы событий, свободные слоты и подтверждения — в одном месте.',
      ),
    ).toBeInTheDocument()
  })

  it('показывает все возможности с точными текстами', () => {
    renderHomePage()

    expect(screen.getByRole('heading', { level: 2, name: 'Возможности' })).toBeInTheDocument()

    expect(
      screen.getByRole('heading', { level: 3, name: 'Выбор типа и времени' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Владелец публикует доступное время, гость выбирает тип события и удобный слот.',
      ),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', { level: 3, name: 'Быстрое бронирование' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Запись с подтверждением и дополнительными заметками — за минуту.'),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', { level: 3, name: 'Управление встречами' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Типы встреч и список предстоящих записей — в админке владельца.'),
    ).toBeInTheDocument()
  })

  it('ведёт к записи обеими ссылками на /booking', () => {
    renderHomePage()

    const bookLink = screen.getByRole('link', { name: 'Записаться' })
    const goToBookingLink = screen.getByRole('link', { name: 'Перейти к записи' })

    expect(bookLink).toBeInTheDocument()
    expect(bookLink).toHaveAttribute('href', '/booking')
    expect(goToBookingLink).toBeInTheDocument()
    expect(goToBookingLink).toHaveAttribute('href', '/booking')
  })
})
