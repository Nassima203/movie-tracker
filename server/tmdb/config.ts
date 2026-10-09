/**
 * Lecture de la configuration du serveur (variables d'environnement Vercel).
 *
 * - `TMDB_READ_ACCESS_TOKEN` est SECRET : il ne doit jamais commencer par `VITE_`,
 *   sinon Vite l'inclurait dans le code envoyé au navigateur.
 * - `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` sont publiques : le
 *   serveur les relit pour vérifier les sessions des utilisatrices.
 */
interface ServerConfig {
  /** Token TMDB, ou null s'il n'est pas encore configuré. */
  tmdbReadAccessToken: string | null
  /** Accès Supabase, ou null s'il n'est pas encore configuré. */
  supabase: { url: string; publishableKey: string } | null
}

/** Retourne la valeur nettoyée de ses espaces, ou null si elle est vide. */
function read(value: string | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export function readServerConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const url = read(env.VITE_SUPABASE_URL)
  const publishableKey = read(env.VITE_SUPABASE_PUBLISHABLE_KEY)

  return {
    tmdbReadAccessToken: read(env.TMDB_READ_ACCESS_TOKEN),
    // Supabase n'est considéré comme configuré que si les DEUX valeurs sont présentes.
    supabase: url && publishableKey ? { url, publishableKey } : null,
  }
}
