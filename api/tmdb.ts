import { createSupabaseTokenVerifier } from '../server/tmdb/auth.js'
import { readServerConfig } from '../server/tmdb/config.js'
import { createTmdbProxyHandler, errorResponse } from '../server/tmdb/handler.js'

/**
 * Vercel Function: GET /api/tmdb?resource=search|movie|tv|season&...
 * Keeps the TMDB token server-side and only serves authenticated uwatch users.
 */
const config = readServerConfig()

const handle = config
  ? createTmdbProxyHandler({
      tmdbReadAccessToken: config.tmdbReadAccessToken,
      verifyAccessToken: createSupabaseTokenVerifier(
        config.supabaseUrl,
        config.supabasePublishableKey,
      ),
    })
  : null

export default {
  async fetch(request: Request): Promise<Response> {
    if (!handle) {
      console.error('[tmdb-proxy] missing server environment variables')
      return errorResponse(500, 'server_misconfigured', 'Server is not configured')
    }

    return handle(request)
  },
}
