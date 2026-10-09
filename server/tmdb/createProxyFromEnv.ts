/**
 * Fabrique le proxy TMDB à partir des variables d'environnement.
 *
 * Trois cas possibles :
 * 1. Pas de token TMDB → le proxy répond « non configuré » (le site bascule
 *    alors sur son petit catalogue de démo).
 * 2. Supabase configuré → chaque requête doit porter une session valide.
 * 3. Supabase absent → accès anonyme UNIQUEMENT si `allowAnonymousWithoutSupabase`
 *    est vrai, c'est-à-dire en développement local (`npm run dev`).
 */
import { createSupabaseTokenVerifier } from './auth.js'
import { readServerConfig } from './config.js'
import { createTmdbProxyHandler, errorResponse } from './handler.js'

interface ProxyEnvOptions {
  /**
   * Développement uniquement : sans Supabase, autorise TMDB sans session pour
   * tester l'interface en local. Doit rester `false` en production, sinon le
   * proxy (et donc le quota TMDB) serait ouvert à n'importe qui.
   */
  allowAnonymousWithoutSupabase: boolean
}

type ProxyHandler = (request: Request) => Promise<Response>

/** Réponse renvoyée quand le serveur n'est pas configuré : on journalise la cause, sans la montrer. */
function misconfigured(logMessage: string, publicMessage: string): ProxyHandler {
  return () => {
    console.error(`[tmdb-proxy] ${logMessage}`)
    return Promise.resolve(errorResponse(500, 'server_misconfigured', publicMessage))
  }
}

export function createProxyFromEnv(env: NodeJS.ProcessEnv, options: ProxyEnvOptions): ProxyHandler {
  const { tmdbReadAccessToken, supabase } = readServerConfig(env)

  // Cas 1 : sans token, impossible d'interroger TMDB.
  if (!tmdbReadAccessToken) {
    return misconfigured('TMDB_READ_ACCESS_TOKEN is not set', 'TMDB is not configured')
  }

  // Cas 2 : mode normal, une session Supabase est exigée.
  if (supabase) {
    return createTmdbProxyHandler({
      tmdbReadAccessToken,
      verifyAccessToken: createSupabaseTokenVerifier(supabase.url, supabase.publishableKey),
    })
  }

  // Cas 3 : développement local sans Supabase.
  if (options.allowAnonymousWithoutSupabase) {
    return createTmdbProxyHandler({ tmdbReadAccessToken, verifyAccessToken: null })
  }

  // Production sans Supabase : on refuse plutôt que d'ouvrir le proxy à tous.
  return misconfigured(
    'Supabase is not configured: refusing anonymous access',
    'Server is not configured',
  )
}
