import type { MediaRef } from '@/types/media'

export function mediaPath(ref: MediaRef): string {
  return ref.mediaType === 'movie'
    ? `/movie/${String(ref.tmdbId)}`
    : `/series/${String(ref.tmdbId)}`
}
