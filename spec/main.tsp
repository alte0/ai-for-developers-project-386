import "@typespec/http";
import "@typespec/openapi";
import "./models.tsp";
import "./routes/health.tsp";
import "./routes/guest.tsp";
import "./routes/admin.tsp";

using TypeSpec.Http;
using TypeSpec.OpenAPI;

/**
 * Контракт сервиса бронирования звонков.
 *
 * Источник истины — `docs/spec.md`, §3 (API-контракт). OpenAPI-документ
 * `docs/openapi.yaml` генерируется из этих файлов (`make openapi`) и не
 * редактируется руками.
 *
 * Общие правила контракта: `Content-Type: application/json`; даты — ISO-8601
 * UTC с `Z` и секундами; пути без версионирования (`/api/...`); пагинации нет;
 * ошибки — единый конверт `{ "error": { "code", "message" } }`.
 */
@service(#{
  title: "Календарь звонков",
})
@info(
  #{
    version: "1.0.0",
  },
)
@doc(
  "Сервис бронирования звонков: владелец публикует типы событий и доступное время, гость записывается на свободный слот. Контракт описывает целевое состояние по docs/spec.md §3; реализовано пока только `GET /api/health`.",
)
@server("http://localhost:3000", "Локальная разработка")
namespace BookingApi;
