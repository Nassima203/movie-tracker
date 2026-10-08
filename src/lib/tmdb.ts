import { supabase } from '@/lib/supabase'

/** Requests accepted by the `/api/tmdb` proxy (see server/tmdb/routes.ts). */
export type TmdbProxyRequest =
  | { resource: 'search'; query: string; page?: number }
  | { resource: 'movie' | 'tv'; id: number }
  | { resource: 'season'; id: number; season: number }

export type TmdbProxyErrorKind =
  | 'unauthorized'
  | 'invalid_request'
  | 'not_found'
  | 'rate_limited'
  | 'timeout'
  | 'network'
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

/**
 * Calls the uwatch TMDB proxy with the current Supabase access token.
 * Returns untyped JSON: callers must validate it before use.
 * An abort triggered by the caller's `signal` is rethrown untouched.
 */
export async function fetchFromTmdbProxy(
  request: TmdbProxyRequest,
  options: { signal?: AbortSignal } = {},
): Promise<unknown> {
  const { data } = await supabase.auth.getSession()
  const accessToken = data.session?.access_token
  if (!accessToken) throw new TmdbProxyError('unauthorized', null, 'No active session')

  const timeout = AbortSignal.timeout(CLIENT_TIMEOUT_MS)
  const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout

  let response: Response
  try {
    response = await fetch(`/api/tmdb?${toSearchParams(request).toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal,
    })
  } catch (error) {
    if (options.signal?.aborted) throw error
    if (timeout.aborted) throw new TmdbProxyError('timeout', null, 'TMDB proxy timed out')
    throw new TmdbProxyError('network', null, 'Network error while calling TMDB proxy')
  }

  if (!response.ok) {
    throw new TmdbProxyError(
      kindFromStatus(response.status),
      response.status,
      `TMDB proxy error ${String(response.status)}`,
    )
  }

  try {
    return (await response.json()) as unknown
  } catch {
    throw new TmdbProxyError('server', response.status, 'Invalid JSON from TMDB proxy')
  }
}
