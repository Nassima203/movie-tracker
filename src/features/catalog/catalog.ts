import { isDemoMode } from '@/lib/env'
import { demoCatalog } from './sources/demoCatalog'
import { proxyCatalog } from './sources/proxyCatalog'
import type { CatalogSource } from './sources/types'

export const catalog: CatalogSource = isDemoMode ? demoCatalog : proxyCatalog

export const catalogKeys = {
  all: ['catalog'] as const,
  search: (query: string) => ['catalog', 'search', query] as const,
  movie: (tmdbId: number) => ['catalog', 'movie', tmdbId] as const,
  series: (tmdbId: number) => ['catalog', 'tv', tmdbId] as const,
}

/** TMDB metadata changes rarely: keep details fresh for an hour. */
export const DETAILS_STALE_TIME = 60 * 60 * 1000
export const SEARCH_STALE_TIME = 5 * 60 * 1000
