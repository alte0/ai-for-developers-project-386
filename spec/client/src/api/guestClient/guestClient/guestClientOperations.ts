import { parse } from "uri-template";
import { GuestClientContext } from "./guestClientContext.js";
import { createRestError } from "../../../helpers/error.js";
import type { OperationOptions } from "../../../helpers/interfaces.js";
import {
  jsonArrayEventTypeGuestToApplicationTransform,
  jsonArraySlotToApplicationTransform,
  jsonBookingPublicToApplicationTransform,
  jsonCreateBookingToTransportTransform,
  jsonErrorEnvelopeToApplicationTransform,
  jsonErrorEnvelopeToApplicationTransform_2,
  jsonErrorEnvelopeToApplicationTransform_3,
} from "../../../models/internal/serializers.js";
import {
  type BookingPublic,
  CreateBooking,
  type ErrorEnvelope,
  type ErrorEnvelope_2,
  type ErrorEnvelope_3,
  type EventTypeGuest,
  type Slot,
} from "../../../models/models.js";

export interface ListEventTypesOptions extends OperationOptions {}
/**
 * Список типов событий в гостевой проекции: без `availabilityMode`.
 *
 * @param {GuestClientContext} client
 * @param {ListEventTypesOptions} [options]
 */
export async function listEventTypes(
  client: GuestClientContext,
  options?: ListEventTypesOptions,
): Promise<Array<EventTypeGuest>> {
  const path = parse("/api/event-types").expand({});
  const httpRequestOptions = {
    headers: {},
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonArrayEventTypeGuestToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface ListSlotsOptions extends OperationOptions {}
/**
 * Свободные слоты типа на горизонт `now … now + 14д` (задаёт сервер, параметров
 * `from`/`to` нет). Занятые и пересекающиеся с любыми записями исключаются
 * (общий календарь владельца). `eventTypeId` обязателен — нарезка зависит от
 * длительности.
 *
 * @param {GuestClientContext} client
 * @param {number} eventTypeId
 * @param {ListSlotsOptions} [options]
 */
export async function listSlots(
  client: GuestClientContext,
  eventTypeId: number,
  options?: ListSlotsOptions,
): Promise<Array<Slot> | ErrorEnvelope> {
  const path = parse("/api/slots{?eventTypeId}").expand({
    eventTypeId: eventTypeId
  });
  const httpRequestOptions = {
    headers: {},
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonArraySlotToApplicationTransform(response.body)!;
  }
  if (+response.status === 404 && response.headers["content-type"]?.includes("application/json")) {
    return jsonErrorEnvelopeToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface CreateBookingOptions extends OperationOptions {}
/**
 * Создание записи. Порядок проверок (spec.md §3.1): несуществующий тип → 404;
 * вне горизонта → 422 `slot_out_of_range`; не в нарезке → 422
 * `slot_not_scheduled`; плохой контакт → 422 `invalid_contact`; конфликт → 409
 * `slot_taken` (последним, гонка гарантированно превращается в 409).
 *
 * @param {GuestClientContext} client
 * @param {CreateBooking} booking
 * @param {CreateBookingOptions} [options]
 */
export async function createBooking(
  client: GuestClientContext,
  booking: CreateBooking,
  options?: CreateBookingOptions,
): Promise<BookingPublic | ErrorEnvelope | ErrorEnvelope_2 | ErrorEnvelope_3> {
  const path = parse("/api/bookings").expand({});
  const httpRequestOptions = {
    headers: {},body: jsonCreateBookingToTransportTransform(booking),
  };
  const response = await client.pathUnchecked(path).post(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 201 && response.headers["content-type"]?.includes("application/json")) {
    return jsonBookingPublicToApplicationTransform(response.body)!;
  }
  if (+response.status === 404 && response.headers["content-type"]?.includes("application/json")) {
    return jsonErrorEnvelopeToApplicationTransform(response.body)!;
  }
  if (+response.status === 422 && response.headers["content-type"]?.includes("application/json")) {
    return jsonErrorEnvelopeToApplicationTransform_2(response.body)!;
  }
  if (+response.status === 409 && response.headers["content-type"]?.includes("application/json")) {
    return jsonErrorEnvelopeToApplicationTransform_3(response.body)!;
  }
  throw createRestError(response);
}
;
