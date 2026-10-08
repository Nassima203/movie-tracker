import { createProxyFromEnv } from '../server/tmdb/createProxyFromEnv.js'

/**
 * Vercel Function: GET /api/tmdb?resource=search|trending|movie|tv|season&...
 * Keeps the TMDB token server-side and only serves authenticated uwatch users.
 */
const handle = createProxyFromEnv(process.env, { allowAnonymousWithoutSupabase: false })

export default {
  fetch(request: Request): Promise<Response> {
    return handle(request)
  },
}
