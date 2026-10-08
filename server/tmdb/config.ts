export interface ServerConfig {
  tmdbReadAccessToken: string
  supabaseUrl: string
  supabasePublishableKey: string
}

/**
 * Server-only configuration. `TMDB_READ_ACCESS_TOKEN` is a secret and must
 * never be prefixed with `VITE_`. The Supabase URL and publishable key are
 * public values, shared with the browser build.
 */
export function readServerConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig | null {
  const tmdbReadAccessToken = env.TMDB_READ_ACCESS_TOKEN?.trim()
  const supabaseUrl = env.VITE_SUPABASE_URL?.trim()
  const supabasePublishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

  if (!tmdbReadAccessToken || !supabaseUrl || !supabasePublishableKey) return null

  return { tmdbReadAccessToken, supabaseUrl, supabasePublishableKey }
}
