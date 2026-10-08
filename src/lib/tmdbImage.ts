/** TMDB images are public (no API key): served directly from the TMDB CDN. */
const IMAGE_BASE = 'https://image.tmdb.org/t/p'
const SAFE_PATH = /^\/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)$/i

const POSTER_WIDTHS = [92, 154, 185, 342, 500, 780] as const
type PosterWidth = (typeof POSTER_WIDTHS)[number]

function isSafePath(path: string | null): path is string {
  return path !== null && SAFE_PATH.test(path)
}

export function posterUrl(path: string | null, width: PosterWidth = 342): string | null {
  return isSafePath(path) ? `${IMAGE_BASE}/w${String(width)}${path}` : null
}

export function posterSrcSet(path: string | null): string | undefined {
  if (!isSafePath(path)) return undefined
  return POSTER_WIDTHS.map(
    (width) => `${IMAGE_BASE}/w${String(width)}${path} ${String(width)}w`,
  ).join(', ')
}

export function backdropUrl(path: string | null, size: 'w780' | 'w1280' = 'w1280'): string | null {
  return isSafePath(path) ? `${IMAGE_BASE}/${size}${path}` : null
}
