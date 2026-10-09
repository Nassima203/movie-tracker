/**
 * Types partagés de la fonctionnalité d'authentification.
 *
 * Ils décrivent l'utilisateur, l'état de session, les erreurs possibles et le
 * contrat (AuthGateway) que doivent respecter les deux implémentations :
 * Supabase (réelle) et démo (simulée).
 */

/** Utilisateur connecté, réduit aux seules informations utiles à l'app. */
export interface AuthUser {
  id: string
  /** Peut être `null` (par exemple en mode démo). */
  email: string | null
}

/**
 * État de la session : en cours de chargement, connecté (avec l'utilisateur)
 * ou anonyme. Le statut permet à TypeScript de savoir quand `user` existe.
 */
export type AuthState =
  { status: 'loading' } | { status: 'authenticated'; user: AuthUser } | { status: 'anonymous' }

/** Identifiants saisis dans le formulaire de connexion ou d'inscription. */
export interface Credentials {
  email: string
  password: string
}

/** Résultat d'une inscription. */
export type SignUpResult =
  /** Connecté immédiatement (confirmation par email désactivée, ou mode démo). */
  | { status: 'signed_in' }
  /** Compte créé : l'utilisateur doit cliquer sur le lien envoyé par email. */
  | { status: 'confirmation_required' }

/** Catégories d'erreurs d'authentification que l'interface sait expliquer. */
export type AuthErrorKind =
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'email_taken'
  | 'email_invalid'
  | 'weak_password'
  | 'same_password'
  | 'not_allowed'
  | 'rate_limited'
  | 'network'
  | 'unknown'

/**
 * Échec d'authentification avec une catégorie (`kind`) que l'interface peut
 * transformer en message clair. Le `message` d'origine sert uniquement au
 * débogage et n'est jamais affiché.
 */
export class AuthFailure extends Error {
  readonly kind: AuthErrorKind

  constructor(kind: AuthErrorKind, message: string) {
    super(message)
    this.name = 'AuthFailure'
    this.kind = kind
  }
}

/**
 * Contrat commun des passerelles d'authentification (Supabase ou démo).
 * Le reste de l'app ne dépend que de cette interface.
 */
export interface AuthGateway {
  /**
   * S'abonne aux changements de session ; l'état courant est émis une fois
   * connu. Renvoie une fonction de désabonnement.
   */
  onChange(listener: (user: AuthUser | null) => void): () => void
  signIn(credentials: Credentials): Promise<void>
  signUp(credentials: Credentials): Promise<SignUpResult>
  /**
   * Envoie un lien de réinitialisation par email. Réussit même si aucun compte
   * n'existe, pour ne pas révéler quelles adresses sont inscrites.
   */
  requestPasswordReset(email: string): Promise<void>
  /** Définit un nouveau mot de passe pour l'utilisateur connecté (après le lien de réinitialisation). */
  updatePassword(password: string): Promise<void>
  signOut(): Promise<void>
}
