/**
 * Client du proxy TMDB de uwatch (`/api/tmdb`).
 *
 * Le navigateur n'appelle jamais TMDB directement : il passe par notre propre
 * route serveur, qui détient la clé TMDB secrète. Ce module construit la
 * requête, ajoute le jeton de session et transforme chaque échec en une
 * `TmdbProxyError` typée, facile à traduire en message utilisateur.
 */
import { supabase } from '@/lib/supabase'

/** Requêtes acceptées par le proxy `/api/tmdb` (voir server/tmdb/routes.ts). */
type TmdbProxyRequest =
  | { resource: 'search'; query: string; page?: number }
  | { resource: 'trending' }
  | { resource: 'movie' | 'tv'; id: number }
  | { resource: 'season'; id: number; season: number }

/** Catégories d'erreur possibles lors d'un appel au proxy. */
type TmdbProxyErrorKind =
  | 'unauthorized'
  | 'invalid_request'
  | 'not_found'
  | 'rate_limited'
  | 'timeout'
  | 'network'
  /** Aucun proxy utilisable : jeton TMDB manquant, ou pas de route /api du tout (aperçu statique). */
  | 'not_configured'
  | 'server'

/**
 * Erreur levée par `fetchFromTmdbProxy`. `kind` indique la cause (pour choisir
 * le message à afficher) et `status` le code HTTP quand il y en a un.
 */
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

/** Délai maximal d'attente d'une réponse, pour ne pas laisser l'interface bloquée. */
const CLIENT_TIMEOUT_MS = 10_000

/** Transforme la requête en paramètres d'URL (`?resource=...&id=...`). */
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

/** Déduit la catégorie d'erreur à partir du code HTTP de la réponse. */
function kindFromStatus(status: number): TmdbProxyErrorKind {
  if (status === 401) return 'unauthorized'
  if (status === 400) return 'invalid_request'
  if (status === 404) return 'not_found'
  if (status === 429) return 'rate_limited'
  if (status === 504) return 'timeout'
  return 'server'
}

/**
 * Lit le code d'erreur renvoyé par le proxy (`{ error: { code: '...' } }`).
 * Le corps n'est pas fiable : on vérifie chaque niveau et on renvoie `null`
 * au moindre doute plutôt que de planter.
 */
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

/** Indique si la réponse annonce du JSON (en-tête `Content-Type`). */
function isJson(response: Response): boolean {
  return response.headers.get('content-type')?.includes('application/json') ?? false
}

/**
 * Appelle le proxy TMDB de uwatch. Avec Supabase configuré, le jeton de session
 * est obligatoire et envoyé ; sans Supabase (démo locale), la requête est anonyme
 * et c'est le proxy de développement qui décide si TMDB est disponible.
 * Renvoie du JSON non typé : l'appelant doit le valider avant de l'utiliser.
 * Une annulation déclenchée par le `signal` de l'appelant est relancée telle quelle.
 */
export async function fetchFromTmdbProxy(
  request: TmdbProxyRequest,
  options: { signal?: AbortSignal } = {},
): Promise<unknown> {
  const headers: Record<string, string> = {}

  if (supabase) {
    const { data } = await supabase.auth.getSession()
    const accessToken = data.session?.access_token
    // Sécurité : le proxy refuse les appels anonymes, inutile d'envoyer la requête.
    if (!accessToken) throw new TmdbProxyError('unauthorized', null, 'No active session')
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  // On combine l'annulation de l'appelant (ex. l'utilisateur tape une nouvelle
  // recherche) et notre propre délai maximal : le premier des deux l'emporte.
  const timeout = AbortSignal.timeout(CLIENT_TIMEOUT_MS)
  const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout

  let response: Response
  try {
    response = await fetch(`/api/tmdb?${toSearchParams(request).toString()}`, { headers, signal })
  } catch (error) {
    // Annulation volontaire : ce n'est pas une vraie erreur, on la laisse passer.
    if (options.signal?.aborted) throw error
    if (timeout.aborted) throw new TmdbProxyError('timeout', null, 'TMDB proxy timed out')
    throw new TmdbProxyError('network', null, 'Network error while calling TMDB proxy')
  }

  // Un hébergement statique sans proxy répond avec le HTML de la SPA (ou une page 404).
  if (!isJson(response)) {
    throw new TmdbProxyError('not_configured', response.status, 'TMDB proxy is not available')
  }

  if (!response.ok) {
    const code = await readErrorCode(response)
    // `server_misconfigured` : le serveur n'a pas de clé TMDB, ce n'est pas une panne.
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
