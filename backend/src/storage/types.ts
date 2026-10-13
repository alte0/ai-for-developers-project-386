export type AvailabilityMode = 'schedule' | 'windows'

export interface EventTypeRecord {
  id: number
  name: string
  durationMinutes: number
  availabilityMode: AvailabilityMode
}

export interface ScheduleIntervalRecord {
  weekday: number
  startMinute: number
  endMinute: number
}

export interface WindowRecord {
  id: number
  eventTypeId: number
  start: string
  end: string
}

export interface BookingRecord {
  id: number
  eventTypeId: number
  start: string
  end: string
  name: string
  email: string
  note: string | null
  createdAt: string
}

export interface NewEventType {
  name: string
  durationMinutes: number
  availabilityMode: AvailabilityMode
}

export interface EventTypePatch {
  name?: string
  durationMinutes?: number
}

export interface NewBooking {
  eventTypeId: number
  start: string
  end: string
  name: string
  email: string
  note: string | null
}

export type CreateBookingResult =
  { status: 'created'; booking: BookingRecord } | { status: 'taken' }

export type DeleteEventTypeResult = 'deleted' | 'not_found' | 'has_bookings'

/**
 * Слой хранилища (docs/spec.md §4): типы событий, расписание, окна и записи.
 * Внедряется в `createApp`, чтобы тесты подставляли своё хранилище.
 */
export interface Storage {
  listEventTypes(): EventTypeRecord[]
  getEventType(id: number): EventTypeRecord | undefined
  createEventType(input: NewEventType): EventTypeRecord
  updateEventType(id: number, patch: EventTypePatch): EventTypeRecord | undefined
  deleteEventType(id: number): DeleteEventTypeResult
  listSchedule(eventTypeId: number): ScheduleIntervalRecord[]
  replaceSchedule(eventTypeId: number, intervals: ScheduleIntervalRecord[]): void
  listWindows(eventTypeId: number): WindowRecord[]
  createWindow(eventTypeId: number, start: string, end: string): WindowRecord
  deleteWindow(id: number): boolean
  listBookings(from?: string): BookingRecord[]
  deleteBooking(id: number): boolean
  createBooking(input: NewBooking): CreateBookingResult
}
