/**
 * Public, browser-exposed configuration. Only `VITE_*` values belong here,
 * and they must never contain secrets: they are bundled into the client build.
 *
 * When Supabase is not configured at all, uwatch runs in demo mode (local data,
 * built-in catalog). A partial configuration is a mistake and fails loudly.
 */
interface SupabaseConfig {
  url: string
  publishableKey: string
}

function readOptional(value: string | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  return trimmed
}

function readSupabaseConfig(): SupabaseConfig | null {
  const url = readOptional(import.meta.env.VITE_SUPABASE_URL)
  const publishableKey = readOptional(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)

  if (!url && !publishableKey) return null
  if (!url || !publishableKey) {
    throw new Error(
      'Incomplete Supabase configuration: set both VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (see .env.example).',
    )
  }

  return { url, publishableKey }
}

export const env = {
  supabase: readSupabaseConfig(),
} as const

export const isDemoMode = env.supabase === null
