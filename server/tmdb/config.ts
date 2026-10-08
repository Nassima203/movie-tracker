export interface ServerConfig {
  /** Secret. Null when TMDB is not configured yet. */
  tmdbReadAccessToken: string | null
  /** Public values shared with the browser build. Null when Supabase is not configured yet. */
  supabase: { url: string; publishableKey: string } | null
}

function read(value: string | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  return trimmed
}

/**
 * Server-only configuration. `TMDB_READ_ACCESS_TOKEN` is a secret and must
 * never be prefixed with `VITE_`.
 */
export function readServerConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const url = read(env.VITE_SUPABASE_URL)
  const publishableKey = read(env.VITE_SUPABASE_PUBLISHABLE_KEY)

  return {
    tmdbReadAccessToken: read(env.TMDB_READ_ACCESS_TOKEN),
    supabase: url && publishableKey ? { url, publishableKey } : null,
  }
}
