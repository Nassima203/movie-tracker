import type { MediaSummary, MovieDetails, SeriesDetails } from '@/types/media'

export interface CatalogSource {
  search(query: string, signal?: AbortSignal): Promise<MediaSummary[]>
  /** Movies and series trending this week. */
  trending(signal?: AbortSignal): Promise<MediaSummary[]>
  getMovie(tmdbId: number, signal?: AbortSignal): Promise<MovieDetails>
  getSeries(tmdbId: number, signal?: AbortSignal): Promise<SeriesDetails>
}
