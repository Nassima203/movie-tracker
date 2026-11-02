/**
 * Messages d'erreur d'authentification affichés à l'utilisateur.
 *
 * Chaque type d'erreur connu (AuthErrorKind) correspond à une phrase claire
 * (en français ou en anglais, voir translations.ts). Les messages bruts renvoyés par le serveur ne sont jamais
 * affichés : ils peuvent être techniques, en anglais, ou révéler des détails
 * internes.
 */
import type { TranslationKey } from '@/features/i18n/translations'
import { AuthFailure, type AuthErrorKind } from './types'
import { t } from '@/features/i18n/i18n'

// Table de correspondance « type d'erreur → clé du texte à afficher ». Le typage
// Record<AuthErrorKind, …> oblige à prévoir un message pour chaque type.
const MESSAGES: Record<AuthErrorKind, TranslationKey> = {
  invalid_credentials: 'authError.invalidCredentials',
  email_not_confirmed: 'authError.emailNotConfirmed',
  email_taken: 'authError.emailTaken',
  email_invalid: 'authError.emailInvalid',
  weak_password: 'authError.weakPassword',
  same_password: 'authError.samePassword',
  rate_limited: 'authError.rateLimited',
  link_expired: 'authError.linkExpired',
  network: 'authError.network',
  unknown: 'authError.unknown',
}

/**
 * Transforme n'importe quelle erreur en message affichable.
 * Seules les AuthFailure ont un message dédié ; toute autre erreur
 * (inattendue) reçoit le message générique, pour ne rien divulguer.
 */
export function authErrorMessage(error: unknown): string {
  return t(error instanceof AuthFailure ? MESSAGES[error.kind] : MESSAGES.unknown)
}
