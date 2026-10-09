/**
 * Redirection après connexion.
 *
 * Quand un visiteur non connecté ouvre une page privée, il est envoyé vers
 * /login. Ce module retient la page demandée (dans sessionStorage) pour l'y
 * ramener une fois connecté, en vérifiant toujours que la destination est
 * une adresse interne à l'application.
 */
const STORAGE_KEY = 'uwatch:post-login-redirect'
const DEFAULT_PATH = '/'

/**
 * N'accepte que des chemins absolus internes à l'application (même origine),
 * afin d'empêcher les redirections ouvertes (« open redirect »), par exemple
 * `//evil.com`, `/\evil.com` ou `https://evil.com`. Toute valeur douteuse est
 * remplacée par la page d'accueil.
 */
export function toSafeRedirectPath(candidate: unknown): string {
  if (typeof candidate !== 'string') return DEFAULT_PATH
  // Doit commencer par « / » : exclut les URL complètes comme https://…
  if (!candidate.startsWith('/')) return DEFAULT_PATH
  // « // » et « /\ » sont interprétés par les navigateurs comme un autre domaine.
  if (candidate.startsWith('//') || candidate.startsWith('/\\')) return DEFAULT_PATH
  // Revenir sur /login après connexion n'aurait aucun sens (boucle).
  if (candidate === '/login' || candidate.startsWith('/login?')) return DEFAULT_PATH

  return candidate
}

/** Retient (de façon sûre) la page où renvoyer l'utilisateur après connexion. */
export function rememberPostLoginRedirect(path: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, toSafeRedirectPath(path))
  } catch {
    // Stockage indisponible (navigation privée, bloqué) : on se rabat sur le chemin par défaut.
  }
}

/**
 * Lit la page mémorisée. La valeur est revérifiée car le stockage peut avoir
 * été modifié entre-temps.
 */
export function readPostLoginRedirect(): string {
  try {
    return toSafeRedirectPath(sessionStorage.getItem(STORAGE_KEY))
  } catch {
    return DEFAULT_PATH
  }
}

/** Efface la page mémorisée une fois la redirection effectuée. */
export function clearPostLoginRedirect(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Rien à effacer quand le stockage est indisponible.
  }
}
