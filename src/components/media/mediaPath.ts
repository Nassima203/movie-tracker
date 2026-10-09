/**
 * Construction des URL des pages de détail, pour ne pas répéter le format
 * des routes dans chaque composant.
 */
import type { MediaRef } from '@/types/media'

/** Chemin de la page de détail d'un titre : `/movie/:id` ou `/series/:id`. */
export function mediaPath(ref: MediaRef): string {
  return ref.mediaType === 'movie'
    ? `/movie/${String(ref.tmdbId)}`
    : `/series/${String(ref.tmdbId)}`
}
