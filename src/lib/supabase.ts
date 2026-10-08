import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import type { Database } from '@/types/database'

/**
 * Single browser Supabase client (null in demo mode).
 *
 * - `flowType: 'pkce'`: the library default is `implicit`; PKCE avoids exposing
 *   tokens in the URL fragment and is the recommended flow for OAuth in SPAs.
 * - `detectSessionInUrl`: exchanges the `?code=` returned by the OAuth redirect.
 */
export const supabase: SupabaseClient<Database> | null = env.supabase
  ? createClient<Database>(env.supabase.url, env.supabase.publishableKey, {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null
