/**
 * Configuration publique de l'application, lue depuis les variables d'environnement.
 *
 * Seules les valeurs `VITE_*` ont leur place ici, et elles ne doivent JAMAIS
 * contenir de secret : Vite les intègre telles quelles dans le code envoyé au
 * navigateur, donc n'importe qui peut les lire.
 *
 * Si Supabase n'est pas configuré du tout, uwatch tourne en « mode démo »
 * (données locales, catalogue intégré). Une configuration partielle est une
 * erreur et fait échouer le démarrage de façon visible.
 */
interface SupabaseConfig {
  url: string
  publishableKey: string
}

/** Renvoie la valeur sans espaces autour, ou `null` si elle est absente ou vide. */
function readOptional(value: string | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  return trimmed
}

/** Lit la configuration Supabase : complète, absente (mode démo) ou erreur. */
function readSupabaseConfig(): SupabaseConfig | null {
  const url = readOptional(import.meta.env.VITE_SUPABASE_URL)
  const publishableKey = readOptional(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)

  // Aucune des deux variables : mode démo assumé.
  if (!url && !publishableKey) return null
  // Une seule des deux : c'est sûrement un oubli, mieux vaut échouer tout de suite
  // que de basculer silencieusement en mode démo.
  if (!url || !publishableKey) {
    throw new Error(
      'Incomplete Supabase configuration: set both VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (see .env.example).',
    )
  }

  return { url, publishableKey }
}

/**
 * Configuration publique calculée une seule fois au chargement du module.
 * `env.supabase` vaut `null` en mode démo.
 */
export const env = {
  supabase: readSupabaseConfig(),
} as const

/** `true` quand l'application fonctionne sans Supabase (données locales uniquement). */
export const isDemoMode = env.supabase === null
