/**
 * Point d'entrée unique des actions d'authentification.
 *
 * Le reste de l'application appelle ces fonctions (signIn, signUp…) sans
 * savoir si elles parlent à Supabase ou au mode démo : le choix de la
 * passerelle est fait une seule fois ici, au chargement du module.
 */
import { supabase } from '@/lib/supabase'
import { createDemoAuthGateway } from './gateways/demoAuthGateway'
import { createSupabaseAuthGateway } from './gateways/supabaseAuthGateway'
import type { Credentials, SignUpResult } from './types'

/**
 * Passerelle d'authentification active : Supabase s'il est configuré
 * (client non nul), sinon le mode démo qui simule tout localement.
 */
export const authGateway = supabase ? createSupabaseAuthGateway(supabase) : createDemoAuthGateway()

/** Connecte l'utilisateur avec son email et son mot de passe. */
export function signIn(credentials: Credentials): Promise<void> {
  return authGateway.signIn(credentials)
}

/** Crée un compte ; le résultat indique si une confirmation par email est requise. */
export function signUp(credentials: Credentials): Promise<SignUpResult> {
  return authGateway.signUp(credentials)
}

/** Demande l'envoi d'un email de réinitialisation du mot de passe. */
export function requestPasswordReset(email: string): Promise<void> {
  return authGateway.requestPasswordReset(email)
}

/** Enregistre un nouveau mot de passe pour l'utilisateur connecté. */
export function updatePassword(password: string): Promise<void> {
  return authGateway.updatePassword(password)
}

/** Déconnecte l'utilisateur sur cet appareil. */
export function signOut(): Promise<void> {
  return authGateway.signOut()
}
