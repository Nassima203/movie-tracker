/**
 * Gestion des erreurs côté interface : traduit les erreurs techniques en
 * messages courts et compréhensibles, et journalise les détails en développement.
 */
import { TmdbProxyError } from '@/lib/tmdb'
import { t } from '@/features/i18n/i18n'

/**
 * Convertit n'importe quelle erreur en un message court et non technique,
 * affichable à l'utilisateur. `fallback` sert quand l'erreur n'est pas reconnue.
 */
export function getUserMessage(error: unknown, fallback = t('common.genericError')): string {
  // On vérifie d'abord la connexion : hors ligne, c'est la vraie cause la plupart du temps.
  // Le test sur `navigator` évite un plantage hors navigateur (tests, rendu serveur).
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return t('errors.offline')
  }

  if (error instanceof TmdbProxyError) {
    switch (error.kind) {
      case 'unauthorized':
        return t('errors.sessionExpired')
      case 'rate_limited':
        return t('errors.rateLimited')
      case 'timeout':
        return t('errors.timeout')
      case 'network':
        return t('errors.network')
      case 'not_found':
        return t('errors.notFound')
      case 'not_configured':
        return t('errors.notConfigured')
      case 'invalid_request':
      case 'server':
        // Rien d'utile à dire à l'utilisateur : message générique.
        return fallback
    }
  }

  return fallback
}

/**
 * Affiche une erreur détaillée dans la console, uniquement en développement :
 * en production on ne divulgue pas de détails techniques.
 */
export function logDevError(context: string, error: unknown): void {
  if (import.meta.env.DEV) console.error(`[uwatch] ${context}`, error)
}
