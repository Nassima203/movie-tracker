import { fetchFromTmdbProxy } from '@/lib/tmdb'
import { parseMovieDetails, parseSearchResponse, parseSeriesDetails } from '../tmdbSchemas'
import type { CatalogSource } from './types'

export const proxyCatalog: CatalogSource = {
  async search(query, signal) {
    const payload = await fetchFromTmdbProxy({ resource: 'search', query }, signalOption(signal))
    return parseSearchResponse(payload)
  },

  async trending(signal) {
    const payload = await fetchFromTmdbProxy({ resource: 'trending' }, signalOption(signal))
    return parseSearchResponse(payload)
  },

  async getMovie(tmdbId, signal) {
    const payload = await fetchFromTmdbProxy(
      { resource: 'movie', id: tmdbId },
      signalOption(signal),
    )
    return parseMovieDetails(payload)
  },

  async getSeries(tmdbId, signal) {
    const payload = await fetchFromTmdbProxy({ resource: 'tv', id: tmdbId }, signalOption(signal))
    return parseSeriesDetails(payload)
  },
}

function signalOption(signal: AbortSignal | undefined): { signal?: AbortSignal } {
  return signal ? { signal } : {}
}
