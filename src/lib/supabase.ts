import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

/**
 * Single browser Supabase client.
 *
 * - `flowType: 'pkce'`: the library default is `implicit`; PKCE avoids exposing
 *   tokens in the URL fragment and is the recommended flow for OAuth in SPAs.
 * - `detectSessionInUrl`: exchanges the `?code=` returned by the OAuth redirect.
 */
export const supabase = createClient(env.supabaseUrl, env.supabasePublishableKey, {
  auth: {
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
