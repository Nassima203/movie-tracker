import { useQuery } from '@tanstack/react-query'
import { catalog, catalogKeys, DETAILS_STALE_TIME } from '../catalog'

export function useMovieDetails(tmdbId: number) {
  return useQuery({
    queryKey: catalogKeys.movie(tmdbId),
    queryFn: ({ signal }) => catalog.getMovie(tmdbId, signal),
    staleTime: DETAILS_STALE_TIME,
  })
}

export function useSeriesDetails(tmdbId: number) {
  return useQuery({
    queryKey: catalogKeys.series(tmdbId),
    queryFn: ({ signal }) => catalog.getSeries(tmdbId, signal),
    staleTime: DETAILS_STALE_TIME,
  })
}

export function useTrending() {
  return useQuery({
    queryKey: catalogKeys.trending,
    queryFn: ({ signal }) => catalog.trending(signal),
    staleTime: DETAILS_STALE_TIME,
  })
}
