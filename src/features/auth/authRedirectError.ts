/**
 * Lecture des erreurs d'authentification présentes dans l'URL.
 *
 * Quand Supabase Auth renvoie l'utilisateur vers l'application (lien de
 * confirmation d'email, lien de réinitialisation…), une éventuelle erreur est
 * encodée dans l'adresse. La page de connexion utilise ce module pour afficher
 * un message compréhensible.
 */

/**
 * Lit une erreur d'authentification renvoyée par Supabase Auth dans une URL de
 * redirection (par exemple un lien de confirmation d'email expiré) — dans la
 * query string pour le flux PKCE, dans le fragment (#) pour le flux implicite —
 * et la convertit en message destiné à l'utilisateur. Les messages bruts du
 * fournisseur ne sont jamais montrés à l'utilisateur.
 *
 * Renvoie `null` s'il n'y a aucune erreur dans l'URL.
 */
export function getAuthRedirectErrorMessage(
  location: Pick<Location, 'search' | 'hash'>,
): string | null {
  const query = new URLSearchParams(location.search)
  // Le fragment commence par « # » : on le retire pour pouvoir le lire comme
  // des paramètres classiques.
  const fragment = new URLSearchParams(location.hash.replace(/^#/, ''))

  const error = query.get('error') ?? fragment.get('error')
  const code = query.get('error_code') ?? fragment.get('error_code')
  const description = query.get('error_description') ?? fragment.get('error_description')

  if (!error && !description) return null

  // Le détail technique n'est journalisé qu'en développement, jamais affiché.
  if (import.meta.env.DEV) {
    console.error('[auth] OAuth redirect error', { error, description })
  }

  if (code === 'otp_expired') {
    return 'Ce lien a expiré ou a déjà été utilisé. Connectez-vous avec votre mot de passe.'
  }

  if (error === 'access_denied') {
    return 'Connexion annulée ou accès refusé.'
  }

  // Cas inconnu : message générique plutôt que le texte du fournisseur.
  return 'La connexion a échoué. Veuillez réessayer.'
}
