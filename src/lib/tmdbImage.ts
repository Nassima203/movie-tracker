/**
 * Construction des URL d'images TMDB (affiches et images de fond).
 * Les images TMDB sont publiques (aucune clé d'API) : elles sont servies
 * directement par le CDN de TMDB, sans passer par notre proxy.
 */
const IMAGE_BASE = 'https://image.tmdb.org/t/p'
// Sécurité : on n'accepte qu'un chemin simple du type « /abc123.jpg ». Cela empêche
// une donnée malformée ou malveillante de fabriquer une URL vers un autre site.
const SAFE_PATH = /^\/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)$/i

/** Largeurs d'affiche proposées par TMDB (en pixels). */
const POSTER_WIDTHS = [92, 154, 185, 342, 500, 780] as const
type PosterWidth = (typeof POSTER_WIDTHS)[number]

/** Vérifie que le chemin d'image existe et respecte le format attendu. */
function isSafePath(path: string | null): path is string {
  return path !== null && SAFE_PATH.test(path)
}

/** URL d'une affiche à la largeur demandée, ou `null` si le chemin est absent ou invalide. */
export function posterUrl(path: string | null, width: PosterWidth = 342): string | null {
  return isSafePath(path) ? `${IMAGE_BASE}/w${String(width)}${path}` : null
}

/**
 * Valeur de l'attribut `srcset` d'une affiche : toutes les largeurs disponibles,
 * pour que le navigateur choisisse la plus adaptée à l'écran.
 */
export function posterSrcSet(path: string | null): string | undefined {
  if (!isSafePath(path)) return undefined
  return POSTER_WIDTHS.map(
    (width) => `${IMAGE_BASE}/w${String(width)}${path} ${String(width)}w`,
  ).join(', ')
}

/** URL d'une image de fond (backdrop), ou `null` si le chemin est absent ou invalide. */
export function backdropUrl(path: string | null, size: 'w780' | 'w1280' = 'w1280'): string | null {
  return isSafePath(path) ? `${IMAGE_BASE}/${size}${path}` : null
}
