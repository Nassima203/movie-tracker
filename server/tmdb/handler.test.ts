// @vitest-environment node
import type { VerifyAccessToken } from './auth.js'
import { createTmdbProxyHandler } from './handler.js'

const TMDB_TOKEN = 'tmdb-secret-token'

function setup(options: {
  verification?: Awaited<ReturnType<VerifyAccessToken>>
  upstream?: () => Promise<Response>
}) {
  const verifyAccessToken = vi.fn<VerifyAccessToken>(() =>
    Promise.resolve(options.verification ?? 'valid'),
  )
  const fetchImpl = vi.fn<typeof fetch>(
    options.upstream ?? (() => Promise.resolve(Response.json({ results: [] }))),
  )
  const handle = createTmdbProxyHandler({
    tmdbReadAccessToken: TMDB_TOKEN,
    verifyAccessToken,
    fetchImpl,
    timeoutMs: 50,
  })
  return { handle, verifyAccessToken, fetchImpl }
}

function get(
  query: string,
  headers: Record<string, string> = { Authorization: 'Bearer user-jwt' },
) {
  return new Request(`http://localhost/api/tmdb?${query}`, { headers })
}

async function errorCode(response: Response): Promise<unknown> {
  const body: unknown = await response.json()
  return typeof body === 'object' && body !== null && 'error' in body ? body.error : null
}

describe('TMDB proxy handler', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('rejects non-GET methods', async () => {
    const { handle } = setup({})
    const response = await handle(new Request('http://localhost/api/tmdb', { method: 'POST' }))

    expect(response.status).toBe(405)
    expect(response.headers.get('allow')).toBe('GET')
  })

  it('rejects requests without a bearer token, without calling TMDB', async () => {
    const { handle, fetchImpl } = setup({})
    const response = await handle(get('resource=search&query=a', {}))

    expect(response.status).toBe(401)
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('rejects invalid sessions', async () => {
    const { handle, fetchImpl } = setup({ verification: 'invalid' })
    const response = await handle(get('resource=search&query=a'))

    expect(response.status).toBe(401)
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('returns 503 when the session cannot be verified', async () => {
    const { handle } = setup({ verification: 'unavailable' })
    expect((await handle(get('resource=search&query=a'))).status).toBe(503)
  })

  it('rejects resources outside the whitelist', async () => {
    const { handle, fetchImpl } = setup({})
    const response = await handle(get('resource=account'))

    expect(response.status).toBe(400)
    expect(await errorCode(response)).toMatchObject({ code: 'invalid_request' })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('calls TMDB with the server-side token and returns the JSON body', async () => {
    const { handle, fetchImpl, verifyAccessToken } = setup({})
    const response = await handle(get('resource=search&query=breaking'))

    expect(verifyAccessToken).toHaveBeenCalledWith('user-jwt')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ results: [] })
    expect(response.headers.get('cache-control')).toBe('private, max-age=300')

    const [url, init] = fetchImpl.mock.calls[0] ?? []
    expect(url).toBe(
      'https://api.themoviedb.org/3/search/multi?query=breaking&page=1&include_adult=false&language=fr-FR',
    )
    expect(new Headers(init?.headers).get('authorization')).toBe(`Bearer ${TMDB_TOKEN}`)
  })

  it('never forwards the user token to TMDB nor leaks the TMDB token to the client', async () => {
    const { handle, fetchImpl } = setup({
      upstream: () =>
        Promise.resolve(new Response('{"status_message":"Invalid API key"}', { status: 401 })),
    })
    const response = await handle(get('resource=movie&id=1'))
    const text = await response.text()

    expect(response.status).toBe(502)
    expect(text).not.toContain(TMDB_TOKEN)
    expect(text).not.toContain('Invalid API key')
    const init = fetchImpl.mock.calls[0]?.[1]
    expect(new Headers(init?.headers).get('authorization')).not.toContain('user-jwt')
  })

  it('maps TMDB 404 and 429 responses', async () => {
    const notFound = setup({ upstream: () => Promise.resolve(new Response('', { status: 404 })) })
    expect((await notFound.handle(get('resource=tv&id=1'))).status).toBe(404)

    const limited = setup({
      upstream: () =>
        Promise.resolve(new Response('', { status: 429, headers: { 'Retry-After': '2' } })),
    })
    const response = await limited.handle(get('resource=tv&id=1'))
    expect(response.status).toBe(429)
    expect(response.headers.get('retry-after')).toBe('2')
  })

  it('returns 504 when TMDB times out', async () => {
    const { handle } = setup({
      upstream: () =>
        new Promise((_resolve, reject) => {
          setTimeout(() => {
            reject(new DOMException('timed out', 'TimeoutError'))
          }, 10)
        }),
    })

    expect((await handle(get('resource=movie&id=1'))).status).toBe(504)
  })

  it('returns 502 when TMDB is unreachable', async () => {
    const { handle } = setup({ upstream: () => Promise.reject(new TypeError('fetch failed')) })
    expect((await handle(get('resource=movie&id=1'))).status).toBe(502)
  })
})
