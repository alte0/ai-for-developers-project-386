/**
 * A sequence of textual characters.
 */
export type String = string;
export interface HealthStatus {
  status: "ok";
}
/**
 * Усечённая проекция типа события для гостя: без режима доступности (spec.md §3.1).
 */
export interface EventTypeGuest {
  id: number;
  name: string;
  /**
   * Длительность в минутах, 15…480.
   */
  durationMinutes: number;
}
/**
 * A 32-bit integer. (`-2,147,483,648` to `2,147,483,647`)
 */
export type Int32 = number;
/**
 * A 64-bit integer. (`-9,223,372,036,854,775,808` to `9,223,372,036,854,775,807`)
 */
export type Int64 = bigint;
/**
 * A whole number. This represent any `integer` value possible.
 * It is commonly represented as `BigInteger` in some languages.
 */
export type Integer = number;
/**
 * A numeric type
 */
export type Numeric = number;
/**
 * Свободный слот: время UTC.
 */
export interface Slot {
  start: Date;
  end: Date;
}
/**
 * An instant in coordinated universal time (UTC)"
 */
export type UtcDateTime = Date;
export interface ErrorEnvelope {
  error: ErrorDetail;
}
export interface ErrorDetail {
  /**
   * Машинный код ошибки.
   */
  code: "event_type_not_found";
  /**
   * Человекочитаемое описание.
   */
  message: string;
}
export interface CreateBooking {
  eventTypeId: number;
  /**
   * Начало слота; сервер пересчитывает и проверяет его сам, клиенту не доверяем.
   */
  start: Date;
  name: string;
  email: string;
  /**
   * Необязательная заметка, ≤ 500 символов.
   */
  note?: string;
}
/**
 * Публичная часть записи: контакт в ответ не возвращается, `id` — «номер записи».
 */
export interface BookingPublic {
  id: number;
  eventTypeId: number;
  start: Date;
  /**
   * Конец замораживается при создании записи.
   */
  end: Date;
}
export interface ErrorEnvelope_2 {
  error: ErrorDetail_2;
}
export interface ErrorDetail_2 {
  /**
   * Машинный код ошибки.
   */
  code: "slot_out_of_range" | "slot_not_scheduled" | "invalid_contact";
  /**
   * Человекочитаемое описание.
   */
  message: string;
}
export interface ErrorEnvelope_3 {
  error: ErrorDetail_3;
}
export interface ErrorDetail_3 {
  /**
   * Машинный код ошибки.
   */
  code: "slot_taken";
  /**
   * Человекочитаемое описание.
   */
  message: string;
}
/**
 * Тип события в админской проекции: с режимом доступности.
 */
export interface EventTypeAdmin {
  id: number;
  name: string;
  /**
   * Длительность в минутах, 15…480.
   */
  durationMinutes: number;
  availabilityMode: AvailabilityMode;
}
/**
 * Режим доступности типа события (взаимоисключающие «расписание» и «ручные окна»).
 */
export enum AvailabilityMode {
  Schedule = "schedule",
  Windows = "windows"
}
export interface CreateEventType {
  /**
   * Название: trim, непустое.
   */
  name: string;
  /**
   * 15…480 минут.
   */
  durationMinutes: number;
  availabilityMode: AvailabilityMode;
}
export interface ErrorEnvelope_4 {
  error: ErrorDetail_4;
}
export interface ErrorDetail_4 {
  /**
   * Машинный код ошибки.
   */
  code: "invalid_name" | "invalid_duration";
  /**
   * Человекочитаемое описание.
   */
  message: string;
}
/**
 * PATCH: переименование и/или смена длительности; смена длительности действует только на будущие слоты.
 */
export interface UpdateEventType {
  name?: string;
  durationMinutes?: number;
}
export interface ErrorEnvelope_5 {
  error: ErrorDetail_5;
}
export interface ErrorDetail_5 {
  /**
   * Машинный код ошибки.
   */
  code: "invalid_name" | "invalid_duration";
  /**
   * Человекочитаемое описание.
   */
  message: string;
}
export interface ErrorEnvelope_6 {
  error: ErrorDetail_6;
}
export interface ErrorDetail_6 {
  /**
   * Машинный код ошибки.
   */
  code: "event_type_has_bookings";
  /**
   * Человекочитаемое описание.
   */
  message: string;
}
/**
 * Интервал расписания: минуты UTC-суток, start < end; несколько интервалов в один день.
 */
export interface ScheduleInterval {
  /**
   * 0 — понедельник … 6 — воскресенье.
   */
  weekday: number;
  /**
   * Минута начала суток, 0…1439; через полночь нельзя (start < end).
   */
  startMinute: number;
  endMinute: number;
}
export interface ErrorEnvelope_7 {
  error: ErrorDetail_7;
}
export interface ErrorDetail_7 {
  /**
   * Машинный код ошибки.
   */
  code: "invalid_schedule";
  /**
   * Человекочитаемое описание.
   */
  message: string;
}
/**
 * Ручное окно доступности. Append-only: создавать только в будущем, редактирования нет.
 */
export interface Window {
  id: number;
  start: Date;
  end: Date;
}
export interface CreateWindow {
  /**
   * `start >= now`: окна в прошлом создавать нельзя.
   */
  start: Date;
  end: Date;
}
export interface ErrorEnvelope_8 {
  error: ErrorDetail_8;
}
export interface ErrorDetail_8 {
  /**
   * Машинный код ошибки.
   */
  code: "invalid_window";
  /**
   * Человекочитаемое описание.
   */
  message: string;
}
export interface ErrorEnvelope_9 {
  error: ErrorDetail_9;
}
export interface ErrorDetail_9 {
  /**
   * Машинный код ошибки.
   */
  code: "not_found";
  /**
   * Человекочитаемое описание.
   */
  message: string;
}
/**
 * Запись в журнале: будущие и прошедшие; контакт виден владельцу.
 */
export interface BookingAdmin {
  id: number;
  eventTypeId: number;
  start: Date;
  /**
   * Конец замораживается при создании записи.
   */
  end: Date;
  name: string;
  email: string;
  note?: string;
  createdAt: Date;
}
