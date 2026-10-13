import {
  AvailabilityMode,
  BookingApiClient,
  type BookingAdmin,
  type BookingPublic,
  type CreateEventType,
  type EventTypeAdmin,
  type EventTypeGuest,
  type ScheduleInterval,
  type Slot,
  type Window as EventTypeWindow,
} from '@booking/client'
import { ApiError } from './errors'

export type BookingApiClientOptions = NonNullable<ConstructorParameters<typeof BookingApiClient>[0]>

/**
 * Тонкая обёртка над сгенерированным SDK (@booking/client из spec/client).
 * Пути в клиенте абсолютные (`/api/...`) — ходим на origin страницы,
 * в dev это vite-прокси на бэкенд.
 *
 * Здесь же централизуются коды ошибок: контрактные ответы-конверты и не-2xx
 * ответы превращаются в `ApiError { code, message }`.
 */
export function createBookingApiClient(options?: BookingApiClientOptions): BookingApiClient {
  return new BookingApiClient({
    endpoint: window.location.origin,
    allowInsecureConnection: true,
    ...options,
  })
}

interface ErrorEnvelope {
  error: { code: string; message: string }
}

function isEnvelope(value: unknown): value is ErrorEnvelope {
  if (typeof value !== 'object' || value === null || !('error' in value)) return false
  const { error } = value
  if (typeof error !== 'object' || error === null || !('code' in error) || !('message' in error)) {
    return false
  }
  return typeof error.code === 'string' && typeof error.message === 'string'
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  const body =
    typeof error === 'object' && error !== null && 'body' in error ? error.body : undefined
  if (isEnvelope(body)) return new ApiError(body.error.code, body.error.message)
  return new ApiError('request_failed', 'Не удалось выполнить запрос к сервису')
}

async function call(operation: () => Promise<unknown>): Promise<void>
async function call<T>(operation: () => Promise<T | ErrorEnvelope>): Promise<T>
async function call<T>(operation: () => Promise<T | ErrorEnvelope>): Promise<unknown> {
  let result: T | ErrorEnvelope
  try {
    result = await operation()
  } catch (error) {
    throw toApiError(error)
  }
  if (isEnvelope(result)) throw new ApiError(result.error.code, result.error.message)
  return result
}

export interface BookingInput {
  eventTypeId: number
  start: Date
  name: string
  email: string
  note?: string
}

export interface EventTypeInput {
  name: string
  durationMinutes: number
  availabilityMode: 'schedule' | 'windows'
}

export interface EventTypeUpdate {
  name?: string
  durationMinutes?: number
}

export interface WindowInput {
  start: Date
  end: Date
}

export const guestApi = {
  listEventTypes(): Promise<EventTypeGuest[]> {
    return call<EventTypeGuest[]>(() =>
      createBookingApiClient().guestClient.guestClient.listEventTypes(),
    )
  },

  listSlots(eventTypeId: number): Promise<Slot[]> {
    return call<Slot[]>(() =>
      createBookingApiClient().guestClient.guestClient.listSlots(eventTypeId),
    )
  },

  createBooking(booking: BookingInput): Promise<BookingPublic> {
    return call<BookingPublic>(() =>
      createBookingApiClient().guestClient.guestClient.createBooking(booking),
    )
  },
}

function toCreateEventType(input: EventTypeInput): CreateEventType {
  return {
    name: input.name,
    durationMinutes: input.durationMinutes,
    availabilityMode:
      input.availabilityMode === 'windows' ? AvailabilityMode.Windows : AvailabilityMode.Schedule,
  }
}

export const adminApi = {
  listEventTypes(): Promise<EventTypeAdmin[]> {
    return call<EventTypeAdmin[]>(() =>
      createBookingApiClient().adminClient.adminClient.listAdminEventTypes(),
    )
  },

  createEventType(input: EventTypeInput): Promise<EventTypeAdmin> {
    return call<EventTypeAdmin>(() =>
      createBookingApiClient().adminClient.adminClient.createEventType(toCreateEventType(input)),
    )
  },

  getEventType(id: number): Promise<EventTypeAdmin> {
    return call<EventTypeAdmin>(() =>
      createBookingApiClient().adminClient.adminClient.getAdminEventType(id),
    )
  },

  updateEventType(id: number, patch: EventTypeUpdate): Promise<EventTypeAdmin> {
    return call<EventTypeAdmin>(() =>
      createBookingApiClient().adminClient.adminClient.updateEventType(id, patch),
    )
  },

  deleteEventType(id: number): Promise<void> {
    return call(() => createBookingApiClient().adminClient.adminClient.deleteEventType(id))
  },

  replaceSchedule(id: number, intervals: ScheduleInterval[]): Promise<void> {
    return call(() =>
      createBookingApiClient().adminClient.adminClient.replaceSchedule(id, intervals),
    )
  },

  listWindows(id: number): Promise<EventTypeWindow[]> {
    return call<EventTypeWindow[]>(() =>
      createBookingApiClient().adminClient.adminClient.listWindows(id),
    )
  },

  createWindow(id: number, input: WindowInput): Promise<EventTypeWindow> {
    return call<EventTypeWindow>(() =>
      createBookingApiClient().adminClient.adminClient.createWindow(id, input),
    )
  },

  deleteWindow(id: number): Promise<void> {
    return call(() => createBookingApiClient().adminClient.adminClient.deleteWindow(id))
  },

  listBookings(from?: Date): Promise<BookingAdmin[]> {
    const client = createBookingApiClient().adminClient.adminClient
    return call<BookingAdmin[]>(() => client.listAdminBookings(from ? { from } : undefined))
  },

  cancelBooking(id: number): Promise<void> {
    return call(() => createBookingApiClient().adminClient.adminClient.deleteBooking(id))
  },
}
