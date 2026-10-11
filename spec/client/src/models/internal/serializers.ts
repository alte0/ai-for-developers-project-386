import type {
  BookingAdmin,
  BookingPublic,
  CreateBooking,
  CreateEventType,
  CreateWindow,
  ErrorDetail,
  ErrorDetail_2,
  ErrorDetail_3,
  ErrorDetail_4,
  ErrorDetail_5,
  ErrorDetail_6,
  ErrorDetail_7,
  ErrorDetail_8,
  ErrorDetail_9,
  ErrorEnvelope,
  ErrorEnvelope_2,
  ErrorEnvelope_3,
  ErrorEnvelope_4,
  ErrorEnvelope_5,
  ErrorEnvelope_6,
  ErrorEnvelope_7,
  ErrorEnvelope_8,
  ErrorEnvelope_9,
  EventTypeAdmin,
  EventTypeGuest,
  HealthStatus,
  ScheduleInterval,
  Slot,
  UpdateEventType,
  Window,
} from "../models.js";

export function decodeBase64(value: string): Uint8Array | undefined {
  if(!value) {
    return value as any;
  }
  // Normalize Base64URL to Base64
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
    .padEnd(value.length + (4 - (value.length % 4)) % 4, '=');

  return new Uint8Array(Buffer.from(base64, 'base64'));
}export function encodeUint8Array(
  value: Uint8Array | undefined | null,
  encoding: BufferEncoding,
): string | undefined {
  if (!value) {
    return value as any;
  }
  return Buffer.from(value).toString(encoding);
}export function dateDeserializer(date?: string | null): Date {
  if (!date) {
    return date as any;
  }

  return new Date(date);
}export function dateRfc7231Deserializer(date?: string | null): Date {
  if (!date) {
    return date as any;
  }

  return new Date(date);
}export function dateRfc3339Serializer(date?: Date | null): string {
  if (!date) {
    return date as any
  }

  return date.toISOString();
}export function dateRfc7231Serializer(date?: Date | null): string {
  if (!date) {
    return date as any;
  }

  return date.toUTCString();
}export function dateUnixTimestampSerializer(date?: Date | null): number {
  if (!date) {
    return date as any;
  }

  return Math.floor(date.getTime() / 1000);
}export function dateUnixTimestampDeserializer(date?: number | null): Date {
  if (!date) {
    return date as any;
  }

  return new Date(date * 1000);
}export function createEventTypePayloadToTransport(payload: CreateEventType) {
  return jsonCreateEventTypeToTransportTransform(payload)!;
}export function updateEventTypePayloadToTransport(payload: UpdateEventType) {
  return jsonUpdateEventTypeToTransportTransform(payload)!;
}export function replaceSchedulePayloadToTransport(
  payload: Array<ScheduleInterval>,
) {
  return jsonArrayScheduleIntervalToTransportTransform(payload)!;
}export function createWindowPayloadToTransport(payload: CreateWindow) {
  return jsonCreateWindowToTransportTransform(payload)!;
}export function createBookingPayloadToTransport(payload: CreateBooking) {
  return jsonCreateBookingToTransportTransform(payload)!;
}export function jsonHealthStatusToTransportTransform(
  input_?: HealthStatus | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    status: input_.status
  }!;
}export function jsonHealthStatusToApplicationTransform(
  input_?: any,
): HealthStatus {
  if(!input_) {
    return input_ as any;
  }
    return {
    status: input_.status
  }!;
}export function jsonArrayEventTypeGuestToTransportTransform(
  items_?: Array<EventTypeGuest> | null,
): any {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonEventTypeGuestToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArrayEventTypeGuestToApplicationTransform(
  items_?: any,
): Array<EventTypeGuest> {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonEventTypeGuestToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonEventTypeGuestToTransportTransform(
  input_?: EventTypeGuest | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,name: input_.name,durationMinutes: input_.durationMinutes
  }!;
}export function jsonEventTypeGuestToApplicationTransform(
  input_?: any,
): EventTypeGuest {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,name: input_.name,durationMinutes: input_.durationMinutes
  }!;
}export function jsonArraySlotToTransportTransform(
  items_?: Array<Slot> | null,
): any {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonSlotToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArraySlotToApplicationTransform(
  items_?: any,
): Array<Slot> {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonSlotToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonSlotToTransportTransform(input_?: Slot | null): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    start: dateRfc3339Serializer(input_.start),end: dateRfc3339Serializer(input_.end)
  }!;
}export function jsonSlotToApplicationTransform(input_?: any): Slot {
  if(!input_) {
    return input_ as any;
  }
    return {
    start: dateDeserializer(input_.start)!,end: dateDeserializer(input_.end)!
  }!;
}export function jsonErrorEnvelopeToTransportTransform(
  input_?: ErrorEnvelope | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    error: jsonErrorDetailToTransportTransform(input_.error)
  }!;
}export function jsonErrorEnvelopeToApplicationTransform(
  input_?: any,
): ErrorEnvelope {
  if(!input_) {
    return input_ as any;
  }
    return {
    error: jsonErrorDetailToApplicationTransform(input_.error)
  }!;
}export function jsonErrorDetailToTransportTransform(
  input_?: ErrorDetail | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    code: input_.code,message: input_.message
  }!;
}export function jsonErrorDetailToApplicationTransform(
  input_?: any,
): ErrorDetail {
  if(!input_) {
    return input_ as any;
  }
    return {
    code: input_.code,message: input_.message
  }!;
}export function jsonCreateBookingToTransportTransform(
  input_?: CreateBooking | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    eventTypeId: input_.eventTypeId,start: dateRfc3339Serializer(input_.start),name: input_.name,email: input_.email,note: input_.note
  }!;
}export function jsonCreateBookingToApplicationTransform(
  input_?: any,
): CreateBooking {
  if(!input_) {
    return input_ as any;
  }
    return {
    eventTypeId: input_.eventTypeId,start: dateDeserializer(input_.start)!,name: input_.name,email: input_.email,note: input_.note
  }!;
}export function jsonBookingPublicToTransportTransform(
  input_?: BookingPublic | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,eventTypeId: input_.eventTypeId,start: dateRfc3339Serializer(input_.start),end: dateRfc3339Serializer(input_.end)
  }!;
}export function jsonBookingPublicToApplicationTransform(
  input_?: any,
): BookingPublic {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,eventTypeId: input_.eventTypeId,start: dateDeserializer(input_.start)!,end: dateDeserializer(input_.end)!
  }!;
}export function jsonErrorEnvelopeToTransportTransform_2(
  input_?: ErrorEnvelope_2 | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    error: jsonErrorDetailToTransportTransform_2(input_.error)
  }!;
}export function jsonErrorEnvelopeToApplicationTransform_2(
  input_?: any,
): ErrorEnvelope_2 {
  if(!input_) {
    return input_ as any;
  }
    return {
    error: jsonErrorDetailToApplicationTransform_2(input_.error)
  }!;
}export function jsonErrorDetailToTransportTransform_2(
  input_?: ErrorDetail_2 | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    code: input_.code,message: input_.message
  }!;
}export function jsonErrorDetailToApplicationTransform_2(
  input_?: any,
): ErrorDetail_2 {
  if(!input_) {
    return input_ as any;
  }
    return {
    code: input_.code,message: input_.message
  }!;
}export function jsonErrorEnvelopeToTransportTransform_3(
  input_?: ErrorEnvelope_3 | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    error: jsonErrorDetailToTransportTransform_3(input_.error)
  }!;
}export function jsonErrorEnvelopeToApplicationTransform_3(
  input_?: any,
): ErrorEnvelope_3 {
  if(!input_) {
    return input_ as any;
  }
    return {
    error: jsonErrorDetailToApplicationTransform_3(input_.error)
  }!;
}export function jsonErrorDetailToTransportTransform_3(
  input_?: ErrorDetail_3 | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    code: input_.code,message: input_.message
  }!;
}export function jsonErrorDetailToApplicationTransform_3(
  input_?: any,
): ErrorDetail_3 {
  if(!input_) {
    return input_ as any;
  }
    return {
    code: input_.code,message: input_.message
  }!;
}export function jsonArrayEventTypeAdminToTransportTransform(
  items_?: Array<EventTypeAdmin> | null,
): any {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonEventTypeAdminToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArrayEventTypeAdminToApplicationTransform(
  items_?: any,
): Array<EventTypeAdmin> {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonEventTypeAdminToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonEventTypeAdminToTransportTransform(
  input_?: EventTypeAdmin | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,name: input_.name,durationMinutes: input_.durationMinutes,availabilityMode: input_.availabilityMode
  }!;
}export function jsonEventTypeAdminToApplicationTransform(
  input_?: any,
): EventTypeAdmin {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,name: input_.name,durationMinutes: input_.durationMinutes,availabilityMode: input_.availabilityMode
  }!;
}export function jsonCreateEventTypeToTransportTransform(
  input_?: CreateEventType | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    name: input_.name,durationMinutes: input_.durationMinutes,availabilityMode: input_.availabilityMode
  }!;
}export function jsonCreateEventTypeToApplicationTransform(
  input_?: any,
): CreateEventType {
  if(!input_) {
    return input_ as any;
  }
    return {
    name: input_.name,durationMinutes: input_.durationMinutes,availabilityMode: input_.availabilityMode
  }!;
}export function jsonErrorEnvelopeToTransportTransform_4(
  input_?: ErrorEnvelope_4 | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    error: jsonErrorDetailToTransportTransform_4(input_.error)
  }!;
}export function jsonErrorEnvelopeToApplicationTransform_4(
  input_?: any,
): ErrorEnvelope_4 {
  if(!input_) {
    return input_ as any;
  }
    return {
    error: jsonErrorDetailToApplicationTransform_4(input_.error)
  }!;
}export function jsonErrorDetailToTransportTransform_4(
  input_?: ErrorDetail_4 | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    code: input_.code,message: input_.message
  }!;
}export function jsonErrorDetailToApplicationTransform_4(
  input_?: any,
): ErrorDetail_4 {
  if(!input_) {
    return input_ as any;
  }
    return {
    code: input_.code,message: input_.message
  }!;
}export function jsonUpdateEventTypeToTransportTransform(
  input_?: UpdateEventType | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    name: input_.name,durationMinutes: input_.durationMinutes
  }!;
}export function jsonUpdateEventTypeToApplicationTransform(
  input_?: any,
): UpdateEventType {
  if(!input_) {
    return input_ as any;
  }
    return {
    name: input_.name,durationMinutes: input_.durationMinutes
  }!;
}export function jsonErrorEnvelopeToTransportTransform_5(
  input_?: ErrorEnvelope_5 | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    error: jsonErrorDetailToTransportTransform_5(input_.error)
  }!;
}export function jsonErrorEnvelopeToApplicationTransform_5(
  input_?: any,
): ErrorEnvelope_5 {
  if(!input_) {
    return input_ as any;
  }
    return {
    error: jsonErrorDetailToApplicationTransform_5(input_.error)
  }!;
}export function jsonErrorDetailToTransportTransform_5(
  input_?: ErrorDetail_5 | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    code: input_.code,message: input_.message
  }!;
}export function jsonErrorDetailToApplicationTransform_5(
  input_?: any,
): ErrorDetail_5 {
  if(!input_) {
    return input_ as any;
  }
    return {
    code: input_.code,message: input_.message
  }!;
}export function jsonErrorEnvelopeToTransportTransform_6(
  input_?: ErrorEnvelope_6 | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    error: jsonErrorDetailToTransportTransform_6(input_.error)
  }!;
}export function jsonErrorEnvelopeToApplicationTransform_6(
  input_?: any,
): ErrorEnvelope_6 {
  if(!input_) {
    return input_ as any;
  }
    return {
    error: jsonErrorDetailToApplicationTransform_6(input_.error)
  }!;
}export function jsonErrorDetailToTransportTransform_6(
  input_?: ErrorDetail_6 | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    code: input_.code,message: input_.message
  }!;
}export function jsonErrorDetailToApplicationTransform_6(
  input_?: any,
): ErrorDetail_6 {
  if(!input_) {
    return input_ as any;
  }
    return {
    code: input_.code,message: input_.message
  }!;
}export function jsonArrayScheduleIntervalToTransportTransform(
  items_?: Array<ScheduleInterval> | null,
): any {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonScheduleIntervalToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArrayScheduleIntervalToApplicationTransform(
  items_?: any,
): Array<ScheduleInterval> {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonScheduleIntervalToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonScheduleIntervalToTransportTransform(
  input_?: ScheduleInterval | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    weekday: input_.weekday,startMinute: input_.startMinute,endMinute: input_.endMinute
  }!;
}export function jsonScheduleIntervalToApplicationTransform(
  input_?: any,
): ScheduleInterval {
  if(!input_) {
    return input_ as any;
  }
    return {
    weekday: input_.weekday,startMinute: input_.startMinute,endMinute: input_.endMinute
  }!;
}export function jsonErrorEnvelopeToTransportTransform_7(
  input_?: ErrorEnvelope_7 | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    error: jsonErrorDetailToTransportTransform_7(input_.error)
  }!;
}export function jsonErrorEnvelopeToApplicationTransform_7(
  input_?: any,
): ErrorEnvelope_7 {
  if(!input_) {
    return input_ as any;
  }
    return {
    error: jsonErrorDetailToApplicationTransform_7(input_.error)
  }!;
}export function jsonErrorDetailToTransportTransform_7(
  input_?: ErrorDetail_7 | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    code: input_.code,message: input_.message
  }!;
}export function jsonErrorDetailToApplicationTransform_7(
  input_?: any,
): ErrorDetail_7 {
  if(!input_) {
    return input_ as any;
  }
    return {
    code: input_.code,message: input_.message
  }!;
}export function jsonArrayWindowToTransportTransform(
  items_?: Array<Window> | null,
): any {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonWindowToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArrayWindowToApplicationTransform(
  items_?: any,
): Array<Window> {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonWindowToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonWindowToTransportTransform(input_?: Window | null): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,start: dateRfc3339Serializer(input_.start),end: dateRfc3339Serializer(input_.end)
  }!;
}export function jsonWindowToApplicationTransform(input_?: any): Window {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,start: dateDeserializer(input_.start)!,end: dateDeserializer(input_.end)!
  }!;
}export function jsonCreateWindowToTransportTransform(
  input_?: CreateWindow | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    start: dateRfc3339Serializer(input_.start),end: dateRfc3339Serializer(input_.end)
  }!;
}export function jsonCreateWindowToApplicationTransform(
  input_?: any,
): CreateWindow {
  if(!input_) {
    return input_ as any;
  }
    return {
    start: dateDeserializer(input_.start)!,end: dateDeserializer(input_.end)!
  }!;
}export function jsonErrorEnvelopeToTransportTransform_8(
  input_?: ErrorEnvelope_8 | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    error: jsonErrorDetailToTransportTransform_8(input_.error)
  }!;
}export function jsonErrorEnvelopeToApplicationTransform_8(
  input_?: any,
): ErrorEnvelope_8 {
  if(!input_) {
    return input_ as any;
  }
    return {
    error: jsonErrorDetailToApplicationTransform_8(input_.error)
  }!;
}export function jsonErrorDetailToTransportTransform_8(
  input_?: ErrorDetail_8 | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    code: input_.code,message: input_.message
  }!;
}export function jsonErrorDetailToApplicationTransform_8(
  input_?: any,
): ErrorDetail_8 {
  if(!input_) {
    return input_ as any;
  }
    return {
    code: input_.code,message: input_.message
  }!;
}export function jsonErrorEnvelopeToTransportTransform_9(
  input_?: ErrorEnvelope_9 | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    error: jsonErrorDetailToTransportTransform_9(input_.error)
  }!;
}export function jsonErrorEnvelopeToApplicationTransform_9(
  input_?: any,
): ErrorEnvelope_9 {
  if(!input_) {
    return input_ as any;
  }
    return {
    error: jsonErrorDetailToApplicationTransform_9(input_.error)
  }!;
}export function jsonErrorDetailToTransportTransform_9(
  input_?: ErrorDetail_9 | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    code: input_.code,message: input_.message
  }!;
}export function jsonErrorDetailToApplicationTransform_9(
  input_?: any,
): ErrorDetail_9 {
  if(!input_) {
    return input_ as any;
  }
    return {
    code: input_.code,message: input_.message
  }!;
}export function jsonArrayBookingAdminToTransportTransform(
  items_?: Array<BookingAdmin> | null,
): any {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonBookingAdminToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArrayBookingAdminToApplicationTransform(
  items_?: any,
): Array<BookingAdmin> {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonBookingAdminToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonBookingAdminToTransportTransform(
  input_?: BookingAdmin | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,eventTypeId: input_.eventTypeId,start: dateRfc3339Serializer(input_.start),end: dateRfc3339Serializer(input_.end),name: input_.name,email: input_.email,note: input_.note,createdAt: dateRfc3339Serializer(input_.createdAt)
  }!;
}export function jsonBookingAdminToApplicationTransform(
  input_?: any,
): BookingAdmin {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,eventTypeId: input_.eventTypeId,start: dateDeserializer(input_.start)!,end: dateDeserializer(input_.end)!,name: input_.name,email: input_.email,note: input_.note,createdAt: dateDeserializer(input_.createdAt)!
  }!;
}
