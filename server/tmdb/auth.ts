/**
 * Vérification des sessions côté serveur.
 *
 * Le navigateur envoie son jeton de session Supabase (un JWT) dans l'en-tête
 * `Authorization: Bearer <jeton>`. Avant d'interroger TMDB, le proxy vérifie
 * que ce jeton est authentique et qu'il appartient à une utilisatrice connectée.
 */
import { createClient } from '@supabase/supabase-js'

/** `unavailable` = impossible de vérifier pour l'instant (Supabase injoignable). */
export type TokenVerification = 'valid' | 'invalid' | 'unavailable'

export type VerifyAccessToken = (token: string) => Promise<TokenVerification>

export function createSupabaseTokenVerifier(
  supabaseUrl: string,
  publishableKey: string,
): VerifyAccessToken {
  // Client « serveur » : pas de session à mémoriser ni à rafraîchir.
  const supabase = createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })

  return async (token) => {
    try {
      // `getClaims` vérifie la signature du jeton (localement, grâce aux clés
      // publiques de Supabase mises en cache) et son expiration.
      const { data, error } = await supabase.auth.getClaims(token)
      if (error || !data) return 'invalid'

      // Le rôle doit être `authenticated` : l'ancienne clé publique « anon » de
      // Supabase est elle aussi un JWT valide, mais ne correspond à personne.
      const { role, sub } = data.claims
      const isUser = role === 'authenticated' && typeof sub === 'string' && sub.length > 0
      return isUser ? 'valid' : 'invalid'
    } catch (cause) {
      console.error('[tmdb-proxy] token verification unavailable', cause)
      return 'unavailable'
    }
  }
}

/** Extrait le jeton de l'en-tête `Authorization: Bearer <jeton>`, ou null s'il est absent ou mal formé. */
export function readBearerToken(request: Request): string | null {
  const header = request.headers.get('authorization')
  const match = header?.match(/^Bearer\s+(\S+)$/i)
  return match?.[1] ?? null
}
