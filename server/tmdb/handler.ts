import { readBearerToken, type VerifyAccessToken } from './auth.js'
import { resolveTmdbRoute } from './routes.js'

const TMDB_API_ORIGIN = 'https://api.themoviedb.org'
const UPSTREAM_TIMEOUT_MS = 8000

export type ProxyErrorCode =
  | 'method_not_allowed'
  | 'unauthorized'
  | 'invalid_request'
  | 'not_found'
  | 'rate_limited'
  | 'upstream_error'
  | 'upstream_timeout'
  | 'auth_unavailable'
  | 'server_misconfigured'

export interface TmdbProxyDeps {
  tmdbReadAccessToken: string
  /** Null only for local development without Supabase (see createProxyFromEnv). */
  verifyAccessToken: VerifyAccessToken | null
  fetchImpl?: typeof fetch
  timeoutMs?: number
}

const baseHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
}

export function errorResponse(
  status: number,
  code: ProxyErrorCode,
  message: string,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify({ error: { code, message } }), {
    status,
    headers: { ...baseHeaders, 'Cache-Control': 'no-store', ...extraHeaders },
  })
}

function isTimeout(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'TimeoutError'
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

export function createTmdbProxyHandler(deps: TmdbProxyDeps) {
  const fetchImpl = deps.fetchImpl ?? fetch
  const timeoutMs = deps.timeoutMs ?? UPSTREAM_TIMEOUT_MS

  return async function handle(request: Request): Promise<Response> {
    if (request.method !== 'GET') {
      return errorResponse(405, 'method_not_allowed', 'Only GET is allowed', { Allow: 'GET' })
    }

    if (deps.verifyAccessToken) {
      const token = readBearerToken(request)
      if (!token) return errorResponse(401, 'unauthorized', 'Missing access token')

      const verification = await deps.verifyAccessToken(token)
      if (verification === 'unavailable') {
        return errorResponse(503, 'auth_unavailable', 'Authentication service unavailable')
      }
      if (verification === 'invalid') return errorResponse(401, 'unauthorized', 'Invalid session')
    }

    const route = resolveTmdbRoute(new URL(request.url).searchParams)
    if (!route.ok) return errorResponse(400, 'invalid_request', route.message)

    const upstreamUrl = new URL(route.upstream.path, TMDB_API_ORIGIN)
    for (const [key, value] of Object.entries(route.upstream.params)) {
      upstreamUrl.searchParams.set(key, value)
    }

    let upstream: Response
    try {
      upstream = await fetchImpl(upstreamUrl.href, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${deps.tmdbReadAccessToken}`,
        },
        // Stops the upstream call on timeout or when the browser aborts (stale search).
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(timeoutMs)]),
      })
    } catch (error) {
      if (isTimeout(error))
        return errorResponse(504, 'upstream_timeout', 'TMDB did not respond in time')
      if (isAbort(error)) return errorResponse(499, 'upstream_error', 'Request aborted by client')
      console.error('[tmdb-proxy] network error', error)
      return errorResponse(502, 'upstream_error', 'TMDB is unreachable')
    }

    if (upstream.status === 404) return errorResponse(404, 'not_found', 'Resource not found')

    if (upstream.status === 429) {
      const retryAfter = upstream.headers.get('retry-after')
      return errorResponse(
        429,
        'rate_limited',
        'Too many requests',
        retryAfter ? { 'Retry-After': retryAfter } : {},
      )
    }

    if (!upstream.ok) {
      // 401 here means our TMDB token is wrong: log it, never forward TMDB's body.
      console.error('[tmdb-proxy] upstream error', upstream.status, route.upstream.path)
      return errorResponse(502, 'upstream_error', 'TMDB request failed')
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        ...baseHeaders,
        // Per-user (Authorization) requests are not cached by the Vercel CDN anyway.
        'Cache-Control': `private, max-age=${String(route.upstream.maxAge)}`,
      },
    })
  }
}
