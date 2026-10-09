/**
 * Passerelle d'authentification réelle, basée sur Supabase Auth.
 *
 * Elle traduit le contrat AuthGateway en appels au client Supabase
 * (connexion par email / mot de passe, inscription, réinitialisation…) et
 * convertit les erreurs Supabase en AuthFailure compréhensibles par l'app.
 */
import { isAuthError, type SupabaseClient, type User } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { AuthFailure, type AuthErrorKind, type AuthGateway, type AuthUser } from '../types'

/** Ne garde de l'utilisateur Supabase que ce dont l'application a besoin. */
function toAuthUser(user: User): AuthUser {
  return { id: user.id, email: user.email ?? null }
}

// Correspondance entre les codes d'erreur Supabase et nos catégories d'erreur.
// Plusieurs codes Supabase peuvent mener à la même catégorie.
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

/**
 * Convertit les erreurs Supabase Auth en catégories ; les messages bruts du
 * serveur n'atteignent jamais l'interface.
 */
export function toAuthFailure(error: unknown): AuthFailure {
  // Ce n'est pas une erreur Supabase : sans doute un problème réseau.
  if (!isAuthError(error)) return new AuthFailure('network', 'Auth request failed')

  // 1. On s'appuie d'abord sur le code d'erreur précis, quand il existe.
  const byCode = error.code ? KIND_BY_CODE[error.code] : undefined
  if (byCode) return new AuthFailure(byCode, error.message)

  // 2. Sinon, on se rabat sur le statut HTTP.
  // Le hook « Before User Created » (liste blanche d'inscription) répond en HTTP 403.
  if (error.status === 403) return new AuthFailure('not_allowed', error.message)
  if (error.status === 429) return new AuthFailure('rate_limited', error.message)
  if (error.status === 0 || error.name === 'AuthRetryableFetchError') {
    return new AuthFailure('network', error.message)
  }
  return new AuthFailure('unknown', error.message)
}

/** Crée la passerelle d'authentification qui s'appuie sur le client Supabase donné. */
export function createSupabaseAuthGateway(client: SupabaseClient<Database>): AuthGateway {
  return {
    onChange(listener) {
      // Callback synchrone volontairement : supabase-js déconseille les callbacks
      // async car ils peuvent provoquer un blocage pendant le rafraîchissement du jeton.
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
        // Le lien de confirmation ramène l'utilisateur sur la page de connexion.
        options: { emailRedirectTo: `${window.location.origin}/login` },
      })
      if (error) throw toAuthFailure(error)
      // Sans session, Supabase attend que l'utilisateur confirme son email.
      return data.session ? { status: 'signed_in' } : { status: 'confirmation_required' }
    },

    async requestPasswordReset(email) {
      // Le lien revient sur /login (déjà autorisée comme URL de redirection) ;
      // l'app ouvre ensuite la page « nouveau mot de passe » (voir passwordRecovery.ts).
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
      // Appareil actuel uniquement (par défaut, Supabase déconnecte tous les appareils).
      const { error } = await client.auth.signOut({ scope: 'local' })
      if (error) throw toAuthFailure(error)
    },
  }
}
