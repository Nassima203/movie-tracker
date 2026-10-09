/**
 * Hooks React pour lire le catalogue (fiche d'un film, fiche d'une série,
 * titres tendance).
 *
 * Ils enveloppent `useQuery` de TanStack Query : les composants obtiennent
 * directement `data`, `isLoading`, `error`… et profitent du cache partagé.
 */
import { useQuery } from '@tanstack/react-query'
import { catalog, catalogKeys, DETAILS_STALE_TIME } from '../catalog'

/**
 * Charge la fiche détaillée d'un film à partir de son identifiant TMDB.
 * Le `signal` fourni par TanStack Query annule la requête si elle devient inutile
 * (composant démonté, changement d'identifiant).
 */
export function useMovieDetails(tmdbId: number) {
  return useQuery({
    queryKey: catalogKeys.movie(tmdbId),
    queryFn: ({ signal }) => catalog.getMovie(tmdbId, signal),
    staleTime: DETAILS_STALE_TIME,
  })
}

/** Charge la fiche détaillée d'une série (avec ses saisons) à partir de son identifiant TMDB. */
export function useSeriesDetails(tmdbId: number) {
  return useQuery({
    queryKey: catalogKeys.series(tmdbId),
    queryFn: ({ signal }) => catalog.getSeries(tmdbId, signal),
    staleTime: DETAILS_STALE_TIME,
  })
}

/** Charge les films et séries tendance de la semaine (affichés sur la page d'accueil). */
export function useTrending() {
  return useQuery({
    queryKey: catalogKeys.trending,
    queryFn: ({ signal }) => catalog.trending(signal),
    staleTime: DETAILS_STALE_TIME,
  })
}
