/**
 * Cœur du proxy TMDB : reçoit la requête du navigateur, la contrôle, interroge
 * TMDB avec le token secret, puis renvoie la réponse.
 *
 * Étapes, dans l'ordre :
 * 1. seule la méthode GET est acceptée ;
 * 2. la session de l'utilisatrice est vérifiée (sauf en développement local sans Supabase) ;
 * 3. la requête doit faire partie de la liste blanche (routes.ts) ;
 * 4. TMDB est appelé avec un délai maximal ;
 * 5. les erreurs sont traduites en messages neutres : le détail de TMDB n'est jamais renvoyé.
 */
import { readBearerToken, type VerifyAccessToken } from './auth.js'
import { resolveTmdbRoute } from './routes.js'

const TMDB_API_ORIGIN = 'https://api.themoviedb.org'
const UPSTREAM_TIMEOUT_MS = 8000 // au-delà, on abandonne et on répond 504

/** Codes d'erreur renvoyés au navigateur (lus par src/lib/tmdb.ts). */
type ProxyErrorCode =
  | 'method_not_allowed'
  | 'unauthorized'
  | 'invalid_request'
  | 'not_found'
  | 'rate_limited'
  | 'upstream_error'
  | 'upstream_timeout'
  | 'auth_unavailable'
  | 'server_misconfigured'

interface TmdbProxyDeps {
  tmdbReadAccessToken: string
  /** null uniquement en développement local sans Supabase (voir createProxyFromEnv). */
  verifyAccessToken: VerifyAccessToken | null
  /** Remplaçables dans les tests. */
  fetchImpl?: typeof fetch
  timeoutMs?: number
}

// En-têtes communs : réponse JSON, et interdiction au navigateur de « deviner » un autre type.
const baseHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
}

/** Construit une réponse d'erreur JSON `{ error: { code, message } }`, jamais mise en cache. */
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

const isTimeout = (error: unknown) => error instanceof DOMException && error.name === 'TimeoutError'
const isAbort = (error: unknown) => error instanceof DOMException && error.name === 'AbortError'

export function createTmdbProxyHandler(deps: TmdbProxyDeps) {
  const fetchImpl = deps.fetchImpl ?? fetch
  const timeoutMs = deps.timeoutMs ?? UPSTREAM_TIMEOUT_MS

  return async function handle(request: Request): Promise<Response> {
    // 1. Lecture seule : pas de POST, PUT, DELETE…
    if (request.method !== 'GET') {
      return errorResponse(405, 'method_not_allowed', 'Only GET is allowed', { Allow: 'GET' })
    }

    // 2. Contrôle de la session (avant tout appel à TMDB, pour ne rien consommer pour un inconnu).
    if (deps.verifyAccessToken) {
      const token = readBearerToken(request)
      if (!token) return errorResponse(401, 'unauthorized', 'Missing access token')

      const verification = await deps.verifyAccessToken(token)
      if (verification === 'unavailable') {
        return errorResponse(503, 'auth_unavailable', 'Authentication service unavailable')
      }
      if (verification === 'invalid') return errorResponse(401, 'unauthorized', 'Invalid session')
    }

    // 3. Liste blanche + validation des paramètres.
    const route = resolveTmdbRoute(new URL(request.url).searchParams)
    if (!route.ok) return errorResponse(400, 'invalid_request', route.message)

    // Seuls les paramètres validés sont transmis à TMDB (les autres sont ignorés).
    const upstreamUrl = new URL(route.upstream.path, TMDB_API_ORIGIN)
    for (const [key, value] of Object.entries(route.upstream.params)) {
      upstreamUrl.searchParams.set(key, value)
    }

    // 4. Appel à TMDB avec le token secret.
    let upstream: Response
    try {
      upstream = await fetchImpl(upstreamUrl.href, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${deps.tmdbReadAccessToken}`,
        },
        // Arrêt si TMDB est trop lent, ou si le navigateur abandonne (recherche dépassée).
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(timeoutMs)]),
      })
    } catch (error) {
      if (isTimeout(error))
        return errorResponse(504, 'upstream_timeout', 'TMDB did not respond in time')
      if (isAbort(error)) return errorResponse(499, 'upstream_error', 'Request aborted by client')
      console.error('[tmdb-proxy] network error', error)
      return errorResponse(502, 'upstream_error', 'TMDB is unreachable')
    }

    // 5. Traduction des erreurs TMDB.
    if (upstream.status === 404) return errorResponse(404, 'not_found', 'Resource not found')

    if (upstream.status === 429) {
      // Trop de requêtes : on transmet le délai d'attente conseillé par TMDB.
      const retryAfter = upstream.headers.get('retry-after')
      return errorResponse(
        429,
        'rate_limited',
        'Too many requests',
        retryAfter ? { 'Retry-After': retryAfter } : {},
      )
    }

    if (!upstream.ok) {
      // Un 401 ici signifie que NOTRE token TMDB est faux : on le note dans les
      // journaux du serveur, sans jamais renvoyer le message de TMDB au navigateur.
      console.error('[tmdb-proxy] upstream error', upstream.status, route.upstream.path)
      return errorResponse(502, 'upstream_error', 'TMDB request failed')
    }

    // Succès : on renvoie le corps tel quel (il sera validé côté navigateur par zod).
    return new Response(upstream.body, {
      status: 200,
      headers: {
        ...baseHeaders,
        // `private` : cache du navigateur uniquement, jamais partagé entre utilisateurs.
        'Cache-Control': `private, max-age=${String(route.upstream.maxAge)}`,
      },
    })
  }
}
