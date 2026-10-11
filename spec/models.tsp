import "@typespec/http";

using TypeSpec.Http;

// Шаблоны ответов без @doc/док-комментариев нарочно: эмиттер подставляет
// стандартное описание статуса («Not Found», «The resource has been created.» …),
// а не текст модели.

model ErrorDetail<Code extends string> {
  /** Машинный код ошибки. */
  code: Code;

  /** Человекочитаемое описание. */
  message: string;
}

// Единый конверт ошибки: `{ "error": { "code", "message" } }` (spec.md §3).
model ErrorEnvelope<Code extends string> {
  error: ErrorDetail<Code>;
}

// Ответ-ошибка: статус и код(ы) берутся из аргументов шаблона.
model ErrorResponse<Status extends int32, Code extends string> {
  @statusCode
  statusCode: Status;

  @body
  body: ErrorEnvelope<Code>;
}

// Ответ 201 Created с телом.
model Created<Body> {
  @statusCode
  statusCode: 201;

  @body
  body: Body;
}
