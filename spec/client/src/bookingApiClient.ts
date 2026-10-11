import {
  type AdminClientContext as AdminClientContext_2,
  type AdminClientOptions as AdminClientOptions_2,
  createAdminClientContext as createAdminClientContext_2,
} from "./api/adminClient/adminClient/adminClientContext.js";
import {
  createEventType,
  type CreateEventTypeOptions,
  createWindow,
  type CreateWindowOptions,
  deleteBooking,
  type DeleteBookingOptions,
  deleteEventType,
  type DeleteEventTypeOptions,
  deleteWindow,
  type DeleteWindowOptions,
  getAdminEventType,
  type GetAdminEventTypeOptions,
  listAdminBookings,
  type ListAdminBookingsOptions,
  listAdminEventTypes,
  type ListAdminEventTypesOptions,
  listWindows,
  type ListWindowsOptions,
  replaceSchedule,
  type ReplaceScheduleOptions,
  updateEventType,
  type UpdateEventTypeOptions,
} from "./api/adminClient/adminClient/adminClientOperations.js";
import {
  type AdminClientContext,
  type AdminClientOptions,
  createAdminClientContext,
} from "./api/adminClient/adminClientContext.js";
import {
  type BookingApiClientContext,
  type BookingApiClientOptions,
  createBookingApiClientContext,
} from "./api/bookingApiClientContext.js";
import {
  createGuestClientContext as createGuestClientContext_2,
  type GuestClientContext as GuestClientContext_2,
  type GuestClientOptions as GuestClientOptions_2,
} from "./api/guestClient/guestClient/guestClientContext.js";
import {
  createBooking,
  type CreateBookingOptions,
  listEventTypes,
  type ListEventTypesOptions,
  listSlots,
  type ListSlotsOptions,
} from "./api/guestClient/guestClient/guestClientOperations.js";
import {
  createGuestClientContext,
  type GuestClientContext,
  type GuestClientOptions,
} from "./api/guestClient/guestClientContext.js";
import {
  createServiceClientContext,
  type ServiceClientContext,
  type ServiceClientOptions,
} from "./api/serviceClient/serviceClientContext.js";
import {
  getHealth,
  type GetHealthOptions,
} from "./api/serviceClient/serviceClientOperations.js";
import type {
  CreateBooking,
  CreateEventType,
  CreateWindow,
  ScheduleInterval,
  UpdateEventType,
} from "./models/models.js";

export class BookingApiClient {
  #context: BookingApiClientContext
  serviceClient: ServiceClient;
  guestClient: GuestClient;
  adminClient: AdminClient
  constructor(options?: BookingApiClientOptions) {
    this.#context = createBookingApiClientContext(options);
    this.serviceClient = new ServiceClient(options);;this
      .guestClient = new GuestClient(options);;this
      .adminClient = new AdminClient(options);
  }
}
export class AdminClient {
  #context: AdminClientContext
  adminClient: AdminClient_2
  constructor(options?: AdminClientOptions) {
    this.#context = createAdminClientContext(options);
    this.adminClient = new AdminClient_2(options);
  }
}
export class AdminClient_2 {
  #context: AdminClientContext_2
  constructor(options?: AdminClientOptions_2) {
    this.#context = createAdminClientContext_2(options);

  }
  async listAdminEventTypes(options?: ListAdminEventTypesOptions) {
    return listAdminEventTypes(this.#context, options);
  };
  async createEventType(
    body: CreateEventType,
    options?: CreateEventTypeOptions,
  ) {
    return createEventType(this.#context, body, options);
  };
  async getAdminEventType(id: number, options?: GetAdminEventTypeOptions) {
    return getAdminEventType(this.#context, id, options);
  };
  async updateEventType(
    id: number,
    body: UpdateEventType,
    options?: UpdateEventTypeOptions,
  ) {
    return updateEventType(this.#context, id, body, options);
  };
  async deleteEventType(id: number, options?: DeleteEventTypeOptions) {
    return deleteEventType(this.#context, id, options);
  };
  async replaceSchedule(
    id: number,
    body: Array<ScheduleInterval>,
    options?: ReplaceScheduleOptions,
  ) {
    return replaceSchedule(this.#context, id, body, options);
  };
  async listWindows(id: number, options?: ListWindowsOptions) {
    return listWindows(this.#context, id, options);
  };
  async createWindow(
    id: number,
    body: CreateWindow,
    options?: CreateWindowOptions,
  ) {
    return createWindow(this.#context, id, body, options);
  };
  async deleteWindow(id: number, options?: DeleteWindowOptions) {
    return deleteWindow(this.#context, id, options);
  };
  async listAdminBookings(options?: ListAdminBookingsOptions) {
    return listAdminBookings(this.#context, options);
  };
  async deleteBooking(id: number, options?: DeleteBookingOptions) {
    return deleteBooking(this.#context, id, options);
  }
}
export class GuestClient {
  #context: GuestClientContext
  guestClient: GuestClient_2
  constructor(options?: GuestClientOptions) {
    this.#context = createGuestClientContext(options);
    this.guestClient = new GuestClient_2(options);
  }
}
export class GuestClient_2 {
  #context: GuestClientContext_2
  constructor(options?: GuestClientOptions_2) {
    this.#context = createGuestClientContext_2(options);

  }
  async listEventTypes(options?: ListEventTypesOptions) {
    return listEventTypes(this.#context, options);
  };
  async listSlots(eventTypeId: number, options?: ListSlotsOptions) {
    return listSlots(this.#context, eventTypeId, options);
  };
  async createBooking(booking: CreateBooking, options?: CreateBookingOptions) {
    return createBooking(this.#context, booking, options);
  }
}
export class ServiceClient {
  #context: ServiceClientContext
  constructor(options?: ServiceClientOptions) {
    this.#context = createServiceClientContext(options);

  }
  async getHealth(options?: GetHealthOptions) {
    return getHealth(this.#context, options);
  }
}
