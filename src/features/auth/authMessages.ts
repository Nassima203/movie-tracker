/**
 * Messages d'erreur d'authentification affichés à l'utilisateur.
 *
 * Chaque type d'erreur connu (AuthErrorKind) correspond à une phrase claire
 * en français. Les messages bruts renvoyés par le serveur ne sont jamais
 * affichés : ils peuvent être techniques, en anglais, ou révéler des détails
 * internes.
 */
import { AuthFailure, type AuthErrorKind } from './types'

// Table de correspondance « type d'erreur → message lisible ». Le typage
// Record<AuthErrorKind, string> oblige à prévoir un message pour chaque type.
const MESSAGES: Record<AuthErrorKind, string> = {
  invalid_credentials: 'Email ou mot de passe incorrect.',
  email_not_confirmed:
    'Confirmez d’abord votre adresse : cliquez sur le lien reçu par email, puis reconnectez-vous.',
  email_taken: 'Un compte existe déjà avec cette adresse. Connectez-vous.',
  email_invalid: 'Adresse email invalide.',
  weak_password:
    'Mot de passe trop faible : utilisez au moins 8 caractères, avec lettres et chiffres.',
  same_password: 'Le nouveau mot de passe doit être différent de l’ancien.',
  not_allowed: 'Cette adresse email n’est pas autorisée à créer un compte.',
  rate_limited: 'Trop de tentatives. Réessayez dans quelques minutes.',
  network: 'Impossible de joindre le serveur. Vérifiez votre connexion.',
  unknown: 'La connexion a échoué. Veuillez réessayer.',
}

/**
 * Transforme n'importe quelle erreur en message affichable.
 * Seules les AuthFailure ont un message dédié ; toute autre erreur
 * (inattendue) reçoit le message générique, pour ne rien divulguer.
 */
export function authErrorMessage(error: unknown): string {
  return error instanceof AuthFailure ? MESSAGES[error.kind] : MESSAGES.unknown
}
