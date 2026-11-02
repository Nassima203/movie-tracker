/**
 * Client Supabase unique utilisé par le navigateur (authentification et base
 * de données). Il vaut `null` en mode démo, quand Supabase n'est pas configuré.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import type { Database } from '@/types/database'

/**
 * Client Supabase partagé par toute l'application (`null` en mode démo).
 *
 * - `flowType: 'pkce'` : la bibliothèque utilise `implicit` par défaut ; PKCE évite
 *   d'exposer les jetons dans le fragment de l'URL.
 * - `detectSessionInUrl` : échange le `?code=` d'un lien reçu par email (ex. :
 *   confirmation de compte) contre une session.
 */
export const supabase: SupabaseClient<Database> | null = env.supabase
  ? createClient<Database>(env.supabase.url, env.supabase.publishableKey, {
      auth: {
        flowType: 'pkce',
        // Garde la session entre deux visites et renouvelle le jeton avant expiration.
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null
