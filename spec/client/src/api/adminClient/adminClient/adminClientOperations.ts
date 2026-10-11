import { parse } from "uri-template";
import { AdminClientContext } from "./adminClientContext.js";
import { createRestError } from "../../../helpers/error.js";
import type { OperationOptions } from "../../../helpers/interfaces.js";
import {
  dateRfc3339Serializer,
  jsonArrayBookingAdminToApplicationTransform,
  jsonArrayEventTypeAdminToApplicationTransform,
  jsonArrayScheduleIntervalToTransportTransform,
  jsonArrayWindowToApplicationTransform,
  jsonCreateEventTypeToTransportTransform,
  jsonCreateWindowToTransportTransform,
  jsonErrorEnvelopeToApplicationTransform_4 as jsonErrorEnvelopeToApplicationTransform,
  jsonErrorEnvelopeToApplicationTransform as jsonErrorEnvelopeToApplicationTransform_2,
  jsonErrorEnvelopeToApplicationTransform_5 as jsonErrorEnvelopeToApplicationTransform_3,
  jsonErrorEnvelopeToApplicationTransform_6 as jsonErrorEnvelopeToApplicationTransform_4,
  jsonErrorEnvelopeToApplicationTransform_7 as jsonErrorEnvelopeToApplicationTransform_5,
  jsonErrorEnvelopeToApplicationTransform_8 as jsonErrorEnvelopeToApplicationTransform_6,
  jsonErrorEnvelopeToApplicationTransform_9 as jsonErrorEnvelopeToApplicationTransform_7,
  jsonEventTypeAdminToApplicationTransform,
  jsonUpdateEventTypeToTransportTransform,
  jsonWindowToApplicationTransform,
} from "../../../models/internal/serializers.js";
import {
  type BookingAdmin,
  CreateEventType,
  CreateWindow,
  type ErrorEnvelope_4 as ErrorEnvelope,
  type ErrorEnvelope as ErrorEnvelope_2,
  type ErrorEnvelope_5 as ErrorEnvelope_3,
  type ErrorEnvelope_6 as ErrorEnvelope_4,
  type ErrorEnvelope_7 as ErrorEnvelope_5,
  type ErrorEnvelope_8 as ErrorEnvelope_6,
  type ErrorEnvelope_9 as ErrorEnvelope_7,
  type EventTypeAdmin,
  ScheduleInterval,
  UpdateEventType,
  type Window,
} from "../../../models/models.js";

export interface ListAdminEventTypesOptions extends OperationOptions {}
/**
 * Типы событий с `availabilityMode`.
 *
 * @param {AdminClientContext} client
 * @param {ListAdminEventTypesOptions} [options]
 */
export async function listAdminEventTypes(
  client: AdminClientContext,
  options?: ListAdminEventTypesOptions,
): Promise<Array<EventTypeAdmin>> {
  const path = parse("/api/admin/event-types").expand({});
  const httpRequestOptions = {
    headers: {},
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonArrayEventTypeAdminToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface CreateEventTypeOptions extends OperationOptions {}
/**
 * Создание типа события.
 *
 * @param {AdminClientContext} client
 * @param {CreateEventType} body
 * @param {CreateEventTypeOptions} [options]
 */
export async function createEventType(
  client: AdminClientContext,
  body: CreateEventType,
  options?: CreateEventTypeOptions,
): Promise<EventTypeAdmin | ErrorEnvelope> {
  const path = parse("/api/admin/event-types").expand({});
  const httpRequestOptions = {
    headers: {},body: jsonCreateEventTypeToTransportTransform(body),
  };
  const response = await client.pathUnchecked(path).post(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 201 && response.headers["content-type"]?.includes("application/json")) {
    return jsonEventTypeAdminToApplicationTransform(response.body)!;
  }
  if (+response.status === 422 && response.headers["content-type"]?.includes("application/json")) {
    return jsonErrorEnvelopeToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface GetAdminEventTypeOptions extends OperationOptions {}
export async function getAdminEventType(
  client: AdminClientContext,
  id: number,
  options?: GetAdminEventTypeOptions,
): Promise<EventTypeAdmin | ErrorEnvelope_2> {
  const path = parse("/api/admin/event-types/{id}").expand({
    id: id
  });
  const httpRequestOptions = {
    headers: {},
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonEventTypeAdminToApplicationTransform(response.body)!;
  }
  if (+response.status === 404 && response.headers["content-type"]?.includes("application/json")) {
    return jsonErrorEnvelopeToApplicationTransform_2(response.body)!;
  }
  throw createRestError(response);
}
;
export interface UpdateEventTypeOptions extends OperationOptions {}
/**
 * Переименование / смена длительности (действует только на будущие слоты).
 *
 * @param {AdminClientContext} client
 * @param {number} id
 * @param {UpdateEventType} body
 * @param {UpdateEventTypeOptions} [options]
 */
export async function updateEventType(
  client: AdminClientContext,
  id: number,
  body: UpdateEventType,
  options?: UpdateEventTypeOptions,
): Promise<EventTypeAdmin | ErrorEnvelope_2 | ErrorEnvelope_3> {
  const path = parse("/api/admin/event-types/{id}").expand({
    id: id
  });
  const httpRequestOptions = {
    headers: {},body: jsonUpdateEventTypeToTransportTransform(body),
  };
  const response = await client.pathUnchecked(path).patch(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonEventTypeAdminToApplicationTransform(response.body)!;
  }
  if (+response.status === 404 && response.headers["content-type"]?.includes("application/json")) {
    return jsonErrorEnvelopeToApplicationTransform_2(response.body)!;
  }
  if (+response.status === 422 && response.headers["content-type"]?.includes("application/json")) {
    return jsonErrorEnvelopeToApplicationTransform_3(response.body)!;
  }
  throw createRestError(response);
}
;
export interface DeleteEventTypeOptions extends OperationOptions {}
/**
 * Удаление типа; при наличии записей → 409.
 *
 * @param {AdminClientContext} client
 * @param {number} id
 * @param {DeleteEventTypeOptions} [options]
 */
export async function deleteEventType(
  client: AdminClientContext,
  id: number,
  options?: DeleteEventTypeOptions,
): Promise<void | ErrorEnvelope_2 | ErrorEnvelope_4> {
  const path = parse("/api/admin/event-types/{id}").expand({
    id: id
  });
  const httpRequestOptions = {
    headers: {},
  };
  const response = await client.pathUnchecked(path).delete(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 204 && !response.body) {
    return;
  }
  if (+response.status === 404 && response.headers["content-type"]?.includes("application/json")) {
    return jsonErrorEnvelopeToApplicationTransform_2(response.body)!;
  }
  if (+response.status === 409 && response.headers["content-type"]?.includes("application/json")) {
    return jsonErrorEnvelopeToApplicationTransform_4(response.body)!;
  }
  throw createRestError(response);
}
;
export interface ReplaceScheduleOptions extends OperationOptions {}
/**
 * Заменяет **всю** неделю разлом. Ответ 200 без тела.
 *
 * @param {AdminClientContext} client
 * @param {number} id
 * @param {Array<ScheduleInterval>} body
 * @param {ReplaceScheduleOptions} [options]
 */
export async function replaceSchedule(
  client: AdminClientContext,
  id: number,
  body: Array<ScheduleInterval>,
  options?: ReplaceScheduleOptions,
): Promise<void | ErrorEnvelope_2 | ErrorEnvelope_5> {
  const path = parse("/api/admin/event-types/{id}/schedule").expand({
    id: id
  });
  const httpRequestOptions = {
    headers: {},body: jsonArrayScheduleIntervalToTransportTransform(body),
  };
  const response = await client.pathUnchecked(path).put(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && !response.body) {
    return;
  }
  if (+response.status === 404 && response.headers["content-type"]?.includes("application/json")) {
    return jsonErrorEnvelopeToApplicationTransform_2(response.body)!;
  }
  if (+response.status === 422 && response.headers["content-type"]?.includes("application/json")) {
    return jsonErrorEnvelopeToApplicationTransform_5(response.body)!;
  }
  throw createRestError(response);
}
;
export interface ListWindowsOptions extends OperationOptions {}
export async function listWindows(
  client: AdminClientContext,
  id: number,
  options?: ListWindowsOptions,
): Promise<Array<Window> | ErrorEnvelope_2> {
  const path = parse("/api/admin/event-types/{id}/windows").expand({
    id: id
  });
  const httpRequestOptions = {
    headers: {},
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonArrayWindowToApplicationTransform(response.body)!;
  }
  if (+response.status === 404 && response.headers["content-type"]?.includes("application/json")) {
    return jsonErrorEnvelopeToApplicationTransform_2(response.body)!;
  }
  throw createRestError(response);
}
;
export interface CreateWindowOptions extends OperationOptions {}
/**
 * Создание ручного окна; только будущее (`start >= now`), пересечения
 * разрешены.
 *
 * @param {AdminClientContext} client
 * @param {number} id
 * @param {CreateWindow} body
 * @param {CreateWindowOptions} [options]
 */
export async function createWindow(
  client: AdminClientContext,
  id: number,
  body: CreateWindow,
  options?: CreateWindowOptions,
): Promise<Window | ErrorEnvelope_2 | ErrorEnvelope_6> {
  const path = parse("/api/admin/event-types/{id}/windows").expand({
    id: id
  });
  const httpRequestOptions = {
    headers: {},body: jsonCreateWindowToTransportTransform(body),
  };
  const response = await client.pathUnchecked(path).post(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 201 && response.headers["content-type"]?.includes("application/json")) {
    return jsonWindowToApplicationTransform(response.body)!;
  }
  if (+response.status === 404 && response.headers["content-type"]?.includes("application/json")) {
    return jsonErrorEnvelopeToApplicationTransform_2(response.body)!;
  }
  if (+response.status === 422 && response.headers["content-type"]?.includes("application/json")) {
    return jsonErrorEnvelopeToApplicationTransform_6(response.body)!;
  }
  throw createRestError(response);
}
;
export interface DeleteWindowOptions extends OperationOptions {}
/**
 * Удаление окна; существующие записи не трогает (запись привязана к типу, не к
 * окну).
 *
 * @param {AdminClientContext} client
 * @param {number} id
 * @param {DeleteWindowOptions} [options]
 */
export async function deleteWindow(
  client: AdminClientContext,
  id: number,
  options?: DeleteWindowOptions,
): Promise<void | ErrorEnvelope_7> {
  const path = parse("/api/admin/windows/{id}").expand({
    id: id
  });
  const httpRequestOptions = {
    headers: {},
  };
  const response = await client.pathUnchecked(path).delete(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 204 && !response.body) {
    return;
  }
  if (+response.status === 404 && response.headers["content-type"]?.includes("application/json")) {
    return jsonErrorEnvelopeToApplicationTransform_7(response.body)!;
  }
  throw createRestError(response);
}
;
export interface ListAdminBookingsOptions extends OperationOptions {
  from?: Date
}
/**
 * Журнал записей (будущие и прошедшие).
 *
 * @param {AdminClientContext} client
 * @param {ListAdminBookingsOptions} [options]
 */
export async function listAdminBookings(
  client: AdminClientContext,
  options?: ListAdminBookingsOptions,
): Promise<Array<BookingAdmin>> {
  const path = parse("/api/admin/bookings{?from}").expand({
    ...(options?.from && {from: dateRfc3339Serializer(options.from)})
  });
  const httpRequestOptions = {
    headers: {},
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonArrayBookingAdminToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface DeleteBookingOptions extends OperationOptions {}
/**
 * Отмена владельцем; время освобождается автоматически.
 *
 * @param {AdminClientContext} client
 * @param {number} id
 * @param {DeleteBookingOptions} [options]
 */
export async function deleteBooking(
  client: AdminClientContext,
  id: number,
  options?: DeleteBookingOptions,
): Promise<void | ErrorEnvelope_7> {
  const path = parse("/api/admin/bookings/{id}").expand({
    id: id
  });
  const httpRequestOptions = {
    headers: {},
  };
  const response = await client.pathUnchecked(path).delete(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 204 && !response.body) {
    return;
  }
  if (+response.status === 404 && response.headers["content-type"]?.includes("application/json")) {
    return jsonErrorEnvelopeToApplicationTransform_7(response.body)!;
  }
  throw createRestError(response);
}
;
