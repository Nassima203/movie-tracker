/**
 * Gestion des erreurs côté interface : traduit les erreurs techniques en
 * messages courts et compréhensibles, et journalise les détails en développement.
 */
import { TmdbProxyError } from '@/lib/tmdb'

/**
 * Convertit n'importe quelle erreur en un message court et non technique,
 * affichable à l'utilisateur. `fallback` sert quand l'erreur n'est pas reconnue.
 */
export function getUserMessage(
  error: unknown,
  fallback = 'Une erreur est survenue. Veuillez réessayer.',
): string {
  // On vérifie d'abord la connexion : hors ligne, c'est la vraie cause la plupart du temps.
  // Le test sur `navigator` évite un plantage hors navigateur (tests, rendu serveur).
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'Vous semblez hors ligne. Vérifiez votre connexion.'
  }

  if (error instanceof TmdbProxyError) {
    switch (error.kind) {
      case 'unauthorized':
        return 'Votre session a expiré. Reconnectez-vous.'
      case 'rate_limited':
        return 'Trop de requêtes. Patientez quelques secondes.'
      case 'timeout':
        return 'Le service de films met trop de temps à répondre.'
      case 'network':
        return 'Impossible de joindre le service de films.'
      case 'not_found':
        return 'Ce titre est introuvable.'
      case 'not_configured':
        return 'Le service de films n’est pas encore configuré.'
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
