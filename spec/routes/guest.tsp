import "../models.tsp";

using TypeSpec.Http;

namespace BookingApi.Guest {
  /** Усечённая проекция типа события для гостя: без режима доступности (spec.md §3.1). */
  model EventTypeGuest {
    id: int32;
    name: string;
    /** Длительность в минутах, 15…480. */
    durationMinutes: int32;
  }

  /** Свободный слот: время UTC. */
  model Slot {
    start: utcDateTime;
    end: utcDateTime;
  }

  model CreateBooking {
    eventTypeId: int32;
    /** Начало слота; сервер пересчитывает и проверяет его сам, клиенту не доверяем. */
    start: utcDateTime;
    name: string;
    email: string;
    /** Необязательная заметка, ≤ 500 символов. */
    @maxLength(500)
    note?: string;
  }

  /** Публичная часть записи: контакт в ответ не возвращается, `id` — «номер записи». */
  model BookingPublic {
    id: int32;
    eventTypeId: int32;
    start: utcDateTime;
    /** Конец замораживается при создании записи. */
    end: utcDateTime;
  }

  @route("/api")
  @tag("guest")
  @doc("Гостевой API (spec.md §3.1).")
  namespace Guest {
    @get
    @route("/event-types")
    @doc("Список типов событий в гостевой проекции: без `availabilityMode`.")
    op listEventTypes(): EventTypeGuest[];

    @get
    @route("/slots")
    @doc(
      "Свободные слоты типа на горизонт `now … now + 14д` (задаёт сервер, параметров `from`/`to` нет). Занятые и пересекающиеся с любыми записями исключаются (общий календарь владельца). `eventTypeId` обязателен — нарезка зависит от длительности.",
    )
    op listSlots(
      @doc("Идентификатор типа события.")
      @query
      eventTypeId: int32,
    ): Slot[] | ErrorResponse<404, "event_type_not_found">;

    @post
    @route("/bookings")
    @doc(
      "Создание записи. Порядок проверок (spec.md §3.1): несуществующий тип → 404; вне горизонта → 422 `slot_out_of_range`; не в нарезке → 422 `slot_not_scheduled`; плохой контакт → 422 `invalid_contact`; конфликт → 409 `slot_taken` (последним, гонка гарантированно превращается в 409).",
    )
    op createBooking(
      @body
      booking: CreateBooking,
    ):
      | Created<BookingPublic>
      | ErrorResponse<404, "event_type_not_found">
      | ErrorResponse<422, "slot_out_of_range" | "slot_not_scheduled" | "invalid_contact">
      | ErrorResponse<409, "slot_taken">;
  }
}
