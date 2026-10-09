import { TmdbProxyError } from '@/lib/tmdb'
import type { MediaSummary } from '@/types/media'
import { createFallbackCatalog } from './fallbackCatalog'
import type { CatalogSource } from './types'

const film: MediaSummary = {
  mediaType: 'movie',
  tmdbId: 1,
  title: 'Film',
  originalTitle: null,
  posterPath: null,
  releaseDate: null,
}

function source(trending: () => Promise<MediaSummary[]>): CatalogSource {
  return {
    search: vi.fn(),
    trending: vi.fn(trending),
    getMovie: vi.fn(),
    getSeries: vi.fn(),
  }
}

describe('createFallbackCatalog', () => {
  it('uses TMDB when the proxy works', async () => {
    const catalog = createFallbackCatalog(
      source(() => Promise.resolve([film])),
      source(() => Promise.resolve([])),
    )

    expect(await catalog.trending()).toEqual([film])
  })

  it('switches to the built-in catalog for good when TMDB is not configured', async () => {
    const primaryTrending = vi.fn(() =>
      Promise.reject(new TmdbProxyError('not_configured', 500, 'not configured')),
    )
    const catalog = createFallbackCatalog(
      source(primaryTrending),
      source(() => Promise.resolve([film])),
    )

    expect(await catalog.trending()).toEqual([film])
    expect(await catalog.trending()).toEqual([film])
    expect(primaryTrending).toHaveBeenCalledTimes(1)
  })

  it('keeps reporting real TMDB failures', async () => {
    const catalog = createFallbackCatalog(
      source(() => Promise.reject(new TmdbProxyError('timeout', 504, 'slow'))),
      source(() => Promise.resolve([film])),
    )

    await expect(catalog.trending()).rejects.toMatchObject({ kind: 'timeout' })
  })
})
