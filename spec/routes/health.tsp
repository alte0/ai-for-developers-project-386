using TypeSpec.Http;

namespace BookingApi {
  model HealthStatus {
    status: "ok";
  }

  @route("/api")
  @tag("service")
  @doc("Служебные операции.")
  namespace Service {
    @get
    @route("/health")
    @doc("Проба живости бэкенда.")
    op getHealth(): HealthStatus;
  }
}
