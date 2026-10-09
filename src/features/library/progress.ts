import type { LibraryItem, SeasonSummary } from '@/types/media'

/**
 * Regular seasons that have started airing. Specials (season 0) and announced
 * seasons without an air date (or airing in the future) are not counted.
 */
export function airedRegularSeasons(seasons: SeasonSummary[], today = new Date()): SeasonSummary[] {
  const todayIso = today.toISOString().slice(0, 10)
  return seasons.filter(
    (season) => season.seasonNumber > 0 && season.airDate !== null && season.airDate <= todayIso,
  )
}

export type SeriesProgressState = 'not_started' | 'in_progress' | 'completed' | 'unknown'

export interface SeriesProgress {
  watched: number
  total: number | null
  state: SeriesProgressState
  /** 0..1, null when the total is unknown. */
  ratio: number | null
}

export function computeSeriesProgress(
  item: Pick<LibraryItem, 'watchedSeasons' | 'seasonCount'>,
): SeriesProgress {
  const watched = item.watchedSeasons.filter((season) => season > 0).length
  const total = item.seasonCount

  if (total === null || total === 0) {
    return { watched, total, state: watched > 0 ? 'in_progress' : 'unknown', ratio: null }
  }

  const counted = Math.min(watched, total)
  const state = counted === 0 ? 'not_started' : counted >= total ? 'completed' : 'in_progress'
  return { watched: counted, total, state, ratio: counted / total }
}

/** Library category used by lists and filters. */
export type LibraryCategory = 'watchlist' | 'in_progress' | 'watched'

export function categorize(item: LibraryItem): LibraryCategory {
  if (item.mediaType === 'movie') {
    return item.status === 'watching' ? 'in_progress' : item.status
  }

  // Series: the seasons decide first, then the status chosen by the user.
  const progress = computeSeriesProgress(item)
  if (progress.state === 'completed') return 'watched'
  if (progress.state === 'in_progress' || item.status === 'watching') return 'in_progress'
  return item.status === 'watched' ? 'watched' : 'watchlist'
}
