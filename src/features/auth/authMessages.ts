import { AuthFailure, type AuthErrorKind } from './types'

const MESSAGES: Record<AuthErrorKind, string> = {
  invalid_credentials: 'Email ou mot de passe incorrect.',
  email_not_confirmed:
    'Confirmez d’abord votre adresse : cliquez sur le lien reçu par email, puis reconnectez-vous.',
  email_taken: 'Un compte existe déjà avec cette adresse. Connectez-vous.',
  email_invalid: 'Adresse email invalide.',
  weak_password:
    'Mot de passe trop faible : utilisez au moins 8 caractères, avec lettres et chiffres.',
  not_allowed: 'Cette adresse email n’est pas autorisée à créer un compte.',
  rate_limited: 'Trop de tentatives. Réessayez dans quelques minutes.',
  network: 'Impossible de joindre le serveur. Vérifiez votre connexion.',
  unknown: 'La connexion a échoué. Veuillez réessayer.',
}

export function authErrorMessage(error: unknown): string {
  return error instanceof AuthFailure ? MESSAGES[error.kind] : MESSAGES.unknown
}
