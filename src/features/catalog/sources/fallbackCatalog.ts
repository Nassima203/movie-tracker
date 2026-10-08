import { TmdbProxyError } from '@/lib/tmdb'
import type { CatalogSource } from './types'

export type CatalogOrigin = 'tmdb' | 'demo'

/**
 * Demo mode only: uses TMDB through the proxy when it is available (local dev
 * with a TMDB token) and switches to the built-in catalog for good as soon as
 * the proxy reports that TMDB is not configured.
 */
export function createFallbackCatalog(
  primary: CatalogSource,
  fallback: CatalogSource,
): CatalogSource & { origin: () => CatalogOrigin } {
  let useFallback = false

  async function run<T>(call: (source: CatalogSource) => Promise<T>): Promise<T> {
    if (useFallback) return call(fallback)
    try {
      return await call(primary)
    } catch (error) {
      if (error instanceof TmdbProxyError && error.kind === 'not_configured') {
        useFallback = true
        return call(fallback)
      }
      throw error
    }
  }

  return {
    origin: () => (useFallback ? 'demo' : 'tmdb'),
    search: (query, signal) => run((source) => source.search(query, signal)),
    trending: (signal) => run((source) => source.trending(signal)),
    getMovie: (tmdbId, signal) => run((source) => source.getMovie(tmdbId, signal)),
    getSeries: (tmdbId, signal) => run((source) => source.getSeries(tmdbId, signal)),
  }
}
