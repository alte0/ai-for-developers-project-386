import { BookingApiClient } from '@booking/client'
import { describe, expect, it } from 'vitest'
import { createBookingApiClient } from './client'

type ClientOptions = NonNullable<ConstructorParameters<typeof BookingApiClient>[0]>
type HttpClient = NonNullable<ClientOptions['httpClient']>
type PipelineRequest = Parameters<HttpClient['sendRequest']>[0]
type PipelineResponse = Awaited<ReturnType<HttpClient['sendRequest']>>

function fakeHttpClient(handler: (request: PipelineRequest) => PipelineResponse): HttpClient {
  return {
    sendRequest: async (request) => handler(request),
  }
}

function jsonResponse(body: unknown, status = 200): PipelineResponse {
  return {
    request: undefined as never,
    status,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === 'content-type' ? 'application/json' : undefined,
      toJSON: () => ({ 'content-type': 'application/json' }),
    } as unknown as PipelineResponse['headers'],
    bodyAsText: JSON.stringify(body),
  }
}

describe('createBookingApiClient (SDK из spec/client)', () => {
  it('ходит на GET /api/health и возвращает статус', async () => {
    const seen: Array<{ method: string; url: string }> = []
    const client = createBookingApiClient({
      httpClient: fakeHttpClient((request) => {
        seen.push({ method: request.method, url: request.url })
        return jsonResponse({ status: 'ok' })
      }),
    })

    const health = await client.serviceClient.getHealth()

    expect(health).toEqual({ status: 'ok' })
    expect(seen).toEqual([{ method: 'GET', url: `${window.location.origin}/api/health` }])
  })

  it('бросает RestError на не-2xx ответ', async () => {
    const client = createBookingApiClient({
      retryOptions: { maxRetries: 0 },
      httpClient: fakeHttpClient(() =>
        jsonResponse({ error: { code: 'boom', message: 'x' } }, 500),
      ),
    })

    await expect(client.serviceClient.getHealth()).rejects.toThrow()
  })
})
