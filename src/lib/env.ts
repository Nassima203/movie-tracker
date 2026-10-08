/**
 * Public, browser-exposed configuration. Only `VITE_*` values belong here,
 * and they must never contain secrets: they are bundled into the client build.
 */
function readRequired(name: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_PUBLISHABLE_KEY'): string {
  const value = import.meta.env[name]

  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Missing environment variable ${name}. See .env.example.`)
  }

  return value
}

export const env = {
  supabaseUrl: readRequired('VITE_SUPABASE_URL'),
  supabasePublishableKey: readRequired('VITE_SUPABASE_PUBLISHABLE_KEY'),
} as const
