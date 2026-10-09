export type MediaType = 'movie' | 'tv'

/** Business identity of a title: TMDB ids are only unique per media type. */
export interface MediaRef {
  mediaType: MediaType
  tmdbId: number
}

export interface MediaSummary extends MediaRef {
  title: string
  originalTitle: string | null
  posterPath: string | null
  /** ISO date (YYYY-MM-DD) or null when unknown. */
  releaseDate: string | null
}

export interface MovieDetails extends MediaSummary {
  mediaType: 'movie'
  overview: string | null
  backdropPath: string | null
  runtimeMinutes: number | null
  genres: string[]
}

export interface SeasonSummary {
  seasonNumber: number
  name: string
  episodeCount: number | null
  airDate: string | null
  posterPath: string | null
}

export interface SeriesDetails extends MediaSummary {
  mediaType: 'tv'
  overview: string | null
  backdropPath: string | null
  genres: string[]
  seasons: SeasonSummary[]
  inProduction: boolean
}

export type MediaDetails = MovieDetails | SeriesDetails

export type LibraryStatus = 'watchlist' | 'watching' | 'watched'

export interface LibraryItem extends MediaSummary {
  status: LibraryStatus
  /** Series only: number of aired regular seasons (specials excluded). */
  seasonCount: number | null
  addedAt: string
  watchedAt: string | null
  updatedAt: string
  /** Series only: watched season numbers, sorted ascending. */
  watchedSeasons: number[]
}

export function mediaKey(ref: MediaRef): string {
  return `${ref.mediaType}:${String(ref.tmdbId)}`
}
