import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { catalog, catalogKeys, SEARCH_STALE_TIME } from '@/features/catalog/catalog'
import { useDebounce } from '@/hooks/useDebounce'
import { TmdbProxyError } from '@/lib/tmdb'
import type { MediaSummary } from '@/types/media'

export const SEARCH_DEBOUNCE_MS = 300
/** Product spec: the search starts from the very first character. */
export const MIN_QUERY_LENGTH = 1

export type SearchStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error'

export interface TmdbSearchState {
  /** The debounced, trimmed query actually sent. */
  query: string
  status: SearchStatus
  results: MediaSummary[]
  /** True while a newer request is in flight (previous results stay visible). */
  isRefreshing: boolean
  error: unknown
  retry: () => void
}

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (
    error instanceof TmdbProxyError &&
    ['invalid_request', 'unauthorized', 'not_found'].includes(error.kind)
  ) {
    return false
  }
  return failureCount < 1
}

/**
 * Debounced TMDB search. TanStack Query provides the cache (identical queries
 * are not refetched) and cancels the request of a stale query through the
 * AbortSignal when the query key changes or the component unmounts.
 */
export function useTmdbSearch(rawQuery: string): TmdbSearchState {
  const trimmed = rawQuery.trim()
  const query = useDebounce(trimmed, SEARCH_DEBOUNCE_MS)
  const enabled = query.length >= MIN_QUERY_LENGTH

  const result = useQuery({
    queryKey: catalogKeys.search(query.toLowerCase()),
    queryFn: ({ signal }) => catalog.search(query, signal),
    enabled,
    staleTime: SEARCH_STALE_TIME,
    placeholderData: keepPreviousData,
    retry: shouldRetry,
  })

  const isDebouncing = trimmed !== query
  const results = enabled ? (result.data ?? []) : []

  let status: SearchStatus
  if (trimmed.length < MIN_QUERY_LENGTH) status = 'idle'
  else if (result.isError && !isDebouncing && !result.isFetching) status = 'error'
  else if (!result.data || (isDebouncing && !enabled)) status = 'loading'
  else if (result.isPlaceholderData || isDebouncing)
    status = results.length > 0 ? 'success' : 'loading'
  else status = results.length > 0 ? 'success' : 'empty'

  return {
    query,
    status,
    results,
    isRefreshing: status === 'success' && (isDebouncing || result.isFetching),
    error: result.error,
    retry: () => {
      void result.refetch()
    },
  }
}
