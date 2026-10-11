import { BookingApiClient } from '@booking/client'

export type BookingApiClientOptions = NonNullable<ConstructorParameters<typeof BookingApiClient>[0]>

/**
 * Тонкая обёртка над сгенерированным SDK (@booking/client из spec/client).
 * Пути в клиенте абсолютные (`/api/...`) — ходим на origin страницы,
 * в dev это vite-прокси на бэкенд.
 */
export function createBookingApiClient(options?: BookingApiClientOptions): BookingApiClient {
  return new BookingApiClient({
    endpoint: window.location.origin,
    allowInsecureConnection: true,
    ...options,
  })
}
