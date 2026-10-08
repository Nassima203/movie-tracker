import { createSupabaseTokenVerifier } from './auth.js'
import { readServerConfig } from './config.js'
import { createTmdbProxyHandler, errorResponse } from './handler.js'

export interface ProxyEnvOptions {
  /**
   * Development only: when Supabase is not configured, serve TMDB without a
   * session so the interface can be tried locally with just a TMDB token.
   * Production must keep this false: the proxy would be open to anyone.
   */
  allowAnonymousWithoutSupabase: boolean
}

export type ProxyHandler = (request: Request) => Promise<Response>

export function createProxyFromEnv(env: NodeJS.ProcessEnv, options: ProxyEnvOptions): ProxyHandler {
  const config = readServerConfig(env)
  const { tmdbReadAccessToken } = config

  if (!tmdbReadAccessToken) {
    return () => {
      console.error('[tmdb-proxy] TMDB_READ_ACCESS_TOKEN is not set')
      return Promise.resolve(errorResponse(500, 'server_misconfigured', 'TMDB is not configured'))
    }
  }

  if (config.supabase) {
    return createTmdbProxyHandler({
      tmdbReadAccessToken,
      verifyAccessToken: createSupabaseTokenVerifier(
        config.supabase.url,
        config.supabase.publishableKey,
      ),
    })
  }

  if (options.allowAnonymousWithoutSupabase) {
    return createTmdbProxyHandler({ tmdbReadAccessToken, verifyAccessToken: null })
  }

  return () => {
    console.error('[tmdb-proxy] Supabase is not configured: refusing anonymous access')
    return Promise.resolve(errorResponse(500, 'server_misconfigured', 'Server is not configured'))
  }
}
