/**
 * Suivi d'une demande de réinitialisation de mot de passe.
 *
 * Mémorise, dans ce navigateur, qu'une réinitialisation a été demandée. Quand
 * l'utilisateur revient via le lien reçu par email (ce qui le connecte), l'app
 * l'envoie vers la page « nouveau mot de passe » au lieu de la page d'accueil.
 *
 * Le lien de réinitialisation ne fonctionne que dans le navigateur qui l'a
 * demandé (PKCE) : un indicateur propre au navigateur suffit donc. Il expire
 * en même temps que le lien (1 heure par défaut).
 */

/** Chemin de la page où l'utilisateur choisit son nouveau mot de passe. */
export const RESET_PASSWORD_PATH = '/reset-password'

const STORAGE_KEY = 'uwatch:password-reset-requested-at'
// Durée de validité de l'indicateur : 1 heure, comme le lien Supabase.
const MAX_AGE_MS = 60 * 60 * 1000

/**
 * Note l'heure de la demande de réinitialisation.
 * `now` est paramétrable pour faciliter les tests.
 */
export function markPasswordResetRequested(now = Date.now()): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(now))
  } catch {
    // Sans stockage, l'utilisateur arrive sur l'accueil et peut quand même se connecter.
  }
}

/**
 * Indique si une demande de réinitialisation récente (moins d'une heure) est
 * en attente dans ce navigateur.
 */
export function isPasswordResetPending(now = Date.now()): boolean {
  try {
    // Une clé absente donne Number(null) = 0, donc « pas de demande ».
    // Une valeur corrompue donne NaN, écartée par Number.isFinite.
    const requestedAt = Number(localStorage.getItem(STORAGE_KEY))
    return Number.isFinite(requestedAt) && requestedAt > 0 && now - requestedAt < MAX_AGE_MS
  } catch {
    return false
  }
}

/**
 * Oublie la demande de réinitialisation (mot de passe changé, ou connexion
 * normale avec l'ancien mot de passe).
 */
export function clearPasswordResetRequest(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Rien à effacer.
  }
}
