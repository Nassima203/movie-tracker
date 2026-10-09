import { isAuthError, type SupabaseClient, type User } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { AuthFailure, type AuthErrorKind, type AuthGateway, type AuthUser } from '../types'

/** Ne garde de l'utilisateur Supabase que ce dont l'application a besoin. */
function toAuthUser(user: User): AuthUser {
  return { id: user.id, email: user.email ?? null }
}

const KIND_BY_CODE: Partial<Record<string, AuthErrorKind>> = {
  invalid_credentials: 'invalid_credentials',
  email_not_confirmed: 'email_not_confirmed',
  user_already_exists: 'email_taken',
  email_exists: 'email_taken',
  email_address_invalid: 'email_invalid',
  weak_password: 'weak_password',
  same_password: 'same_password',
  signup_disabled: 'not_allowed',
  email_address_not_authorized: 'not_allowed',
  over_request_rate_limit: 'rate_limited',
  over_email_send_rate_limit: 'rate_limited',
}

/** Maps Supabase Auth errors to kinds; raw server messages never reach the UI. */
export function toAuthFailure(error: unknown): AuthFailure {
  if (!isAuthError(error)) return new AuthFailure('network', 'Auth request failed')

  const byCode = error.code ? KIND_BY_CODE[error.code] : undefined
  if (byCode) return new AuthFailure(byCode, error.message)

  // The "Before User Created" hook (sign-up allowlist) answers with HTTP 403.
  if (error.status === 403) return new AuthFailure('not_allowed', error.message)
  if (error.status === 429) return new AuthFailure('rate_limited', error.message)
  if (error.status === 0 || error.name === 'AuthRetryableFetchError') {
    return new AuthFailure('network', error.message)
  }
  return new AuthFailure('unknown', error.message)
}

export function createSupabaseAuthGateway(client: SupabaseClient<Database>): AuthGateway {
  return {
    onChange(listener) {
      // Synchronous callback on purpose: async callbacks are deprecated by
      // supabase-js because they can deadlock during token refresh.
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        listener(session ? toAuthUser(session.user) : null)
      })
      return () => {
        data.subscription.unsubscribe()
      }
    },

    async signIn({ email, password }) {
      const { error } = await client.auth.signInWithPassword({ email, password })
      if (error) throw toAuthFailure(error)
    },

    async signUp({ email, password }) {
      const { data, error } = await client.auth.signUp({
        email,
        password,
        // The confirmation link brings the user back to the login page.
        options: { emailRedirectTo: `${window.location.origin}/login` },
      })
      if (error) throw toAuthFailure(error)
      return data.session ? { status: 'signed_in' } : { status: 'confirmation_required' }
    },

    async requestPasswordReset(email) {
      // The link returns to /login (already an allowed redirect URL); the app then
      // opens the "new password" page (see passwordRecovery.ts).
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      })
      if (error) throw toAuthFailure(error)
    },

    async updatePassword(password) {
      const { error } = await client.auth.updateUser({ password })
      if (error) throw toAuthFailure(error)
    },

    async signOut() {
      // Current device only (Supabase defaults to every device).
      const { error } = await client.auth.signOut({ scope: 'local' })
      if (error) throw toAuthFailure(error)
    },
  }
}
