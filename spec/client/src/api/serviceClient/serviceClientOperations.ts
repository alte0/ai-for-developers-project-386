import { parse } from "uri-template";
import { ServiceClientContext } from "./serviceClientContext.js";
import { createRestError } from "../../helpers/error.js";
import type { OperationOptions } from "../../helpers/interfaces.js";
import {
  jsonHealthStatusToApplicationTransform,
} from "../../models/internal/serializers.js";
import type { HealthStatus } from "../../models/models.js";

export interface GetHealthOptions extends OperationOptions {}
/**
 * Проба живости бэкенда.
 *
 * @param {ServiceClientContext} client
 * @param {GetHealthOptions} [options]
 */
export async function getHealth(
  client: ServiceClientContext,
  options?: GetHealthOptions,
): Promise<HealthStatus> {
  const path = parse("/api/health").expand({});
  const httpRequestOptions = {
    headers: {},
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonHealthStatusToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
