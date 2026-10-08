import { createClient } from '@supabase/supabase-js'

export type TokenVerification = 'valid' | 'invalid' | 'unavailable'

export type VerifyAccessToken = (token: string) => Promise<TokenVerification>

/**
 * Verifies a Supabase user access token. With asymmetric signing keys the
 * signature is checked locally (JWKS cached by the client, reused across
 * invocations of a warm function instance).
 *
 * The `authenticated` role check matters: the legacy `anon` key is itself a
 * validly signed JWT and must not grant access to the proxy.
 */
export function createSupabaseTokenVerifier(
  supabaseUrl: string,
  publishableKey: string,
): VerifyAccessToken {
  const supabase = createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })

  return async (token) => {
    try {
      const { data, error } = await supabase.auth.getClaims(token)
      if (error || !data) return 'invalid'

      const { role, sub } = data.claims
      return role === 'authenticated' && typeof sub === 'string' && sub.length > 0
        ? 'valid'
        : 'invalid'
    } catch (cause) {
      console.error('[tmdb-proxy] token verification unavailable', cause)
      return 'unavailable'
    }
  }
}

export function readBearerToken(request: Request): string | null {
  const header = request.headers.get('authorization')
  const match = header?.match(/^Bearer\s+(\S+)$/i)
  return match?.[1] ?? null
}
