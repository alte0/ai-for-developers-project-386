import "../models.tsp";

using TypeSpec.Http;

namespace BookingApi.Admin {
  /** Режим доступности типа события (взаимоисключающие «расписание» и «ручные окна»). */
  enum AvailabilityMode {
    schedule: "schedule",
    windows: "windows",
  }

  /** Тип события в админской проекции: с режимом доступности. */
  model EventTypeAdmin {
    id: int32;
    name: string;
    /** Длительность в минутах, 15…480. */
    durationMinutes: int32;
    availabilityMode: AvailabilityMode;
  }

  model CreateEventType {
    /** Название: trim, непустое. */
    name: string;
    /** 15…480 минут. */
    @minValue(15)
    @maxValue(480)
    durationMinutes: int32;
    availabilityMode: AvailabilityMode;
  }

  /** PATCH: переименование и/или смена длительности; смена длительности действует только на будущие слоты. */
  model UpdateEventType {
    name?: string;
    @minValue(15)
    @maxValue(480)
    durationMinutes?: int32;
  }

  /** Интервал расписания: минуты UTC-суток, start < end; несколько интервалов в один день. */
  model ScheduleInterval {
    /** 0 — понедельник … 6 — воскресенье. */
    @minValue(0)
    @maxValue(6)
    weekday: int32;

    /** Минута начала суток, 0…1439; через полночь нельзя (start < end). */
    @minValue(0)
    @maxValue(1439)
    startMinute: int32;

    @minValue(1)
    @maxValue(1440)
    endMinute: int32;
  }

  /** Ручное окно доступности. Append-only: создавать только в будущем, редактирования нет. */
  model Window {
    id: int32;
    start: utcDateTime;
    end: utcDateTime;
  }

  model CreateWindow {
    /** `start >= now`: окна в прошлом создавать нельзя. */
    start: utcDateTime;
    end: utcDateTime;
  }

  /** Запись в журнале: будущие и прошедшие; контакт виден владельцу. */
  model BookingAdmin {
    id: int32;
    eventTypeId: int32;
    start: utcDateTime;
    /** Конец замораживается при создании записи. */
    end: utcDateTime;
    name: string;
    email: string;
    @maxLength(500)
    note?: string;
    createdAt: utcDateTime;
  }

  @route("/api/admin")
  @tag("admin")
  @doc("Админский API (spec.md §3.2), без авторизации.")
  namespace Admin {
    @get
    @route("/event-types")
    @doc("Типы событий с `availabilityMode`.")
    op listAdminEventTypes(): EventTypeAdmin[];

    @post
    @route("/event-types")
    @doc("Создание типа события.")
    op createEventType(
      @body
      body: CreateEventType,
    ): Created<EventTypeAdmin> | ErrorResponse<422, "invalid_name" | "invalid_duration">;

    @get
    @route("/event-types/{id}")
    op getAdminEventType(
      @path
      id: int32,
    ): EventTypeAdmin | ErrorResponse<404, "event_type_not_found">;

    @patch
    @route("/event-types/{id}")
    @doc("Переименование / смена длительности (действует только на будущие слоты).")
    op updateEventType(
      @path
      id: int32,
      @body
      body: UpdateEventType,
    ):
      | EventTypeAdmin
      | ErrorResponse<404, "event_type_not_found">
      | ErrorResponse<422, "invalid_name" | "invalid_duration">;

    @delete
    @route("/event-types/{id}")
    @doc("Удаление типа; при наличии записей → 409.")
    op deleteEventType(
      @path
      id: int32,
    ):
      | NoContentResponse
      | ErrorResponse<404, "event_type_not_found">
      | ErrorResponse<409, "event_type_has_bookings">;

    @put
    @route("/event-types/{id}/schedule")
    @doc("Заменяет **всю** неделю разлом. Ответ 200 без тела.")
    op replaceSchedule(
      @path
      id: int32,
      @body
      body: ScheduleInterval[],
    ):
      | OkResponse
      | ErrorResponse<404, "event_type_not_found">
      | ErrorResponse<422, "invalid_schedule">;

    @get
    @route("/event-types/{id}/windows")
    op listWindows(
      @path
      id: int32,
    ): Window[] | ErrorResponse<404, "event_type_not_found">;

    @post
    @route("/event-types/{id}/windows")
    @doc("Создание ручного окна; только будущее (`start >= now`), пересечения разрешены.")
    op createWindow(
      @path
      id: int32,
      @body
      body: CreateWindow,
    ):
      | Created<Window>
      | ErrorResponse<404, "event_type_not_found">
      | ErrorResponse<422, "invalid_window">;

    @delete
    @route("/windows/{id}")
    @doc("Удаление окна; существующие записи не трогает (запись привязана к типу, не к окну).")
    op deleteWindow(
      @path
      id: int32,
    ): NoContentResponse | ErrorResponse<404, "not_found">;

    @get
    @route("/bookings")
    @doc("Журнал записей (будущие и прошедшие).")
    op listAdminBookings(
      @doc("Отсечка: показывать записи с `start` не раньше этого момента.")
      @query
      from?: utcDateTime,
    ): BookingAdmin[];

    @delete
    @route("/bookings/{id}")
    @doc("Отмена владельцем; время освобождается автоматически.")
    op deleteBooking(
      @path
      id: int32,
    ): NoContentResponse | ErrorResponse<404, "not_found">;
  }
}
