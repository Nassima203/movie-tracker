import { supabase } from '@/lib/supabase'

/** Requests accepted by the `/api/tmdb` proxy (see server/tmdb/routes.ts). */
export type TmdbProxyRequest =
  | { resource: 'search'; query: string; page?: number }
  | { resource: 'trending' }
  | { resource: 'movie' | 'tv'; id: number }
  | { resource: 'season'; id: number; season: number }

export type TmdbProxyErrorKind =
  | 'unauthorized'
  | 'invalid_request'
  | 'not_found'
  | 'rate_limited'
  | 'timeout'
  | 'network'
  /** No usable proxy: TMDB token missing, or no /api route at all (static preview). */
  | 'not_configured'
  | 'server'

export class TmdbProxyError extends Error {
  readonly kind: TmdbProxyErrorKind
  readonly status: number | null

  constructor(kind: TmdbProxyErrorKind, status: number | null, message: string) {
    super(message)
    this.name = 'TmdbProxyError'
    this.kind = kind
    this.status = status
  }
}

const CLIENT_TIMEOUT_MS = 10_000

function toSearchParams(request: TmdbProxyRequest): URLSearchParams {
  const params = new URLSearchParams({ resource: request.resource })

  switch (request.resource) {
    case 'search':
      params.set('query', request.query)
      if (request.page !== undefined) params.set('page', String(request.page))
      break
    case 'trending':
      break
    case 'movie':
    case 'tv':
      params.set('id', String(request.id))
      break
    case 'season':
      params.set('id', String(request.id))
      params.set('season', String(request.season))
      break
  }

  return params
}

function kindFromStatus(status: number): TmdbProxyErrorKind {
  if (status === 401) return 'unauthorized'
  if (status === 400) return 'invalid_request'
  if (status === 404) return 'not_found'
  if (status === 429) return 'rate_limited'
  if (status === 504) return 'timeout'
  return 'server'
}

async function readErrorCode(response: Response): Promise<string | null> {
  try {
    const body: unknown = await response.json()
    if (typeof body !== 'object' || body === null || !('error' in body)) return null
    const { error } = body
    if (typeof error !== 'object' || error === null || !('code' in error)) return null
    return typeof error.code === 'string' ? error.code : null
  } catch {
    return null
  }
}

function isJson(response: Response): boolean {
  return response.headers.get('content-type')?.includes('application/json') ?? false
}

/**
 * Calls the uwatch TMDB proxy. With Supabase configured, the session token is
 * required and attached; without it (local demo), the request is anonymous and
 * the development proxy decides whether TMDB is available.
 * Returns untyped JSON: callers must validate it before use.
 * An abort triggered by the caller's `signal` is rethrown untouched.
 */
export async function fetchFromTmdbProxy(
  request: TmdbProxyRequest,
  options: { signal?: AbortSignal } = {},
): Promise<unknown> {
  const headers: Record<string, string> = {}

  if (supabase) {
    const { data } = await supabase.auth.getSession()
    const accessToken = data.session?.access_token
    if (!accessToken) throw new TmdbProxyError('unauthorized', null, 'No active session')
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  const timeout = AbortSignal.timeout(CLIENT_TIMEOUT_MS)
  const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout

  let response: Response
  try {
    response = await fetch(`/api/tmdb?${toSearchParams(request).toString()}`, { headers, signal })
  } catch (error) {
    if (options.signal?.aborted) throw error
    if (timeout.aborted) throw new TmdbProxyError('timeout', null, 'TMDB proxy timed out')
    throw new TmdbProxyError('network', null, 'Network error while calling TMDB proxy')
  }

  // A static host without the proxy answers with the SPA's HTML (or a 404 page).
  if (!isJson(response)) {
    throw new TmdbProxyError('not_configured', response.status, 'TMDB proxy is not available')
  }

  if (!response.ok) {
    const code = await readErrorCode(response)
    const kind =
      code === 'server_misconfigured' ? 'not_configured' : kindFromStatus(response.status)
    throw new TmdbProxyError(kind, response.status, `TMDB proxy error ${String(response.status)}`)
  }

  try {
    return (await response.json()) as unknown
  } catch {
    throw new TmdbProxyError('server', response.status, 'Invalid JSON from TMDB proxy')
  }
}
