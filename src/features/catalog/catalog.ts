import { isDemoMode } from '@/lib/env'
import { demoCatalog } from './sources/demoCatalog'
import { createFallbackCatalog } from './sources/fallbackCatalog'
import { proxyCatalog } from './sources/proxyCatalog'
import type { CatalogSource } from './sources/types'

/**
 * Real mode: TMDB only. Demo mode (no Supabase): TMDB when the local proxy has
 * a token, otherwise the built-in catalog.
 */
export const catalog: CatalogSource = isDemoMode
  ? createFallbackCatalog(proxyCatalog, demoCatalog)
  : proxyCatalog

export const catalogKeys = {
  all: ['catalog'] as const,
  search: (query: string) => ['catalog', 'search', query] as const,
  trending: ['catalog', 'trending'] as const,
  movie: (tmdbId: number) => ['catalog', 'movie', tmdbId] as const,
  series: (tmdbId: number) => ['catalog', 'tv', tmdbId] as const,
}

/** TMDB metadata changes rarely: keep details fresh for an hour. */
export const DETAILS_STALE_TIME = 60 * 60 * 1000
export const SEARCH_STALE_TIME = 5 * 60 * 1000
