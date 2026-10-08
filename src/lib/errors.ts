import { TmdbProxyError } from '@/lib/tmdb'

/** Maps any error to a short, non-technical message for the interface. */
export function getUserMessage(
  error: unknown,
  fallback = 'Une erreur est survenue. Veuillez réessayer.',
): string {
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
        return fallback
    }
  }

  return fallback
}

/** Detailed errors are only logged in development. */
export function logDevError(context: string, error: unknown): void {
  if (import.meta.env.DEV) console.error(`[uwatch] ${context}`, error)
}
