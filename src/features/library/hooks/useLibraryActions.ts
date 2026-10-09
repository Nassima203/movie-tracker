import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/toast/useToast'
import { catalog, catalogKeys, DETAILS_STALE_TIME } from '@/features/catalog/catalog'
import { getUserMessage, logDevError } from '@/lib/errors'
import type {
  LibraryItem,
  LibraryStatus,
  MediaRef,
  MediaSummary,
  SeriesDetails,
} from '@/types/media'
import { airedRegularSeasons } from '../progress'
import { libraryRepository } from '../repository'
import { libraryQueryKey, useLibraryUserId } from './useLibrary'

type Updater = (items: LibraryItem[]) => LibraryItem[]

function sameMedia(a: MediaRef, b: MediaRef): boolean {
  return a.mediaType === b.mediaType && a.tmdbId === b.tmdbId
}

function toSummary(media: MediaSummary): MediaSummary {
  return {
    mediaType: media.mediaType,
    tmdbId: media.tmdbId,
    title: media.title,
    originalTitle: media.originalTitle,
    posterPath: media.posterPath,
    releaseDate: media.releaseDate,
  }
}

function upsertLocal(
  items: LibraryItem[],
  next: Partial<LibraryItem> & MediaSummary,
): LibraryItem[] {
  const now = new Date().toISOString()
  const existing = items.find((item) => sameMedia(item, next))
  const merged: LibraryItem = {
    status: 'watchlist',
    seasonCount: null,
    addedAt: now,
    watchedAt: null,
    watchedSeasons: [],
    ...existing,
    ...next,
    updatedAt: now,
  }
  return [merged, ...items.filter((item) => item !== existing)]
}

/**
 * Shared optimistic-update plumbing: the cache is updated immediately, rolled
 * back on failure (with a toast) and re-synced with the server afterwards.
 */
function useOptimisticLibraryMutation<TVariables>(options: {
  mutationFn: (variables: TVariables) => Promise<void>
  optimistic: (variables: TVariables) => Updater
  errorMessage: string
}) {
  const queryClient = useQueryClient()
  const userId = useLibraryUserId()
  const { notify } = useToast()
  const queryKey = libraryQueryKey(userId)

  return useMutation({
    mutationFn: options.mutationFn,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<LibraryItem[]>(queryKey)
      queryClient.setQueryData<LibraryItem[]>(queryKey, (items) =>
        options.optimistic(variables)(items ?? []),
      )
      return { previous }
    },
    onError: (error, _variables, context) => {
      logDevError(options.errorMessage, error)
      queryClient.setQueryData(queryKey, context?.previous)
      notify(getUserMessage(error, options.errorMessage), 'error')
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })
}

/** Series status after a season change: all aired seen → watched, some → watching. */
function seasonStatus(
  completed: boolean,
  watchedSeasons: Set<number>,
  current: LibraryItem | null,
): LibraryStatus {
  if (completed) return 'watched'
  if ([...watchedSeasons].some((season) => season > 0)) return 'watching'
  return current?.status === 'watching' ? 'watching' : 'watchlist'
}

export function useAddToWatchlist() {
  return useOptimisticLibraryMutation({
    mutationFn: (media: MediaSummary) =>
      libraryRepository.upsert({ ...toSummary(media), status: 'watchlist' }),
    optimistic: (media) => (items) =>
      upsertLocal(items, { ...toSummary(media), status: 'watchlist', watchedAt: null }),
    errorMessage: 'Impossible d’ajouter ce titre à votre liste.',
  })
}

export function useMarkWatching() {
  return useOptimisticLibraryMutation({
    mutationFn: (media: MediaSummary) =>
      libraryRepository.upsert({ ...toSummary(media), status: 'watching' }),
    optimistic: (media) => (items) =>
      upsertLocal(items, { ...toSummary(media), status: 'watching', watchedAt: null }),
    errorMessage: 'Impossible de marquer ce titre comme en cours.',
  })
}

export function useMarkWatched() {
  const queryClient = useQueryClient()

  async function fetchSeries(tmdbId: number): Promise<SeriesDetails> {
    return queryClient.query({
      queryKey: catalogKeys.series(tmdbId),
      queryFn: ({ signal }) => catalog.getSeries(tmdbId, signal),
      staleTime: DETAILS_STALE_TIME,
    })
  }

  return useOptimisticLibraryMutation({
    mutationFn: async (media: MediaSummary) => {
      if (media.mediaType === 'movie') {
        await libraryRepository.upsert({ ...toSummary(media), status: 'watched' })
        return
      }

      // A series marked as watched = every aired regular season watched.
      const details = await fetchSeries(media.tmdbId)
      const aired = airedRegularSeasons(details.seasons).map((season) => season.seasonNumber)
      await libraryRepository.upsert({
        ...toSummary(details),
        status: 'watched',
        seasonCount: aired.length,
      })
      await libraryRepository.setSeasonsWatched(details.tmdbId, aired, true)
    },
    optimistic: (media) => (items) =>
      upsertLocal(items, {
        ...toSummary(media),
        status: 'watched',
        watchedAt: new Date().toISOString(),
      }),
    errorMessage: 'Impossible de marquer ce titre comme vu.',
  })
}

export function useRemoveFromLibrary() {
  return useOptimisticLibraryMutation({
    mutationFn: (ref: MediaRef) => libraryRepository.remove(ref),
    optimistic: (ref) => (items) => items.filter((item) => !sameMedia(item, ref)),
    errorMessage: 'Impossible de retirer ce titre.',
  })
}

export interface SetSeasonsVariables {
  series: SeriesDetails
  seasonNumbers: number[]
  watched: boolean
  current: LibraryItem | null
}

/**
 * Marks seasons as (un)watched. Adds the series to the library first when
 * needed, and keeps the stored status consistent with the progress.
 */
export function useSetSeasonsWatched() {
  return useOptimisticLibraryMutation({
    mutationFn: async ({ series, seasonNumbers, watched, current }: SetSeasonsVariables) => {
      const aired = airedRegularSeasons(series.seasons).map((season) => season.seasonNumber)
      const nextWatched = new Set(current?.watchedSeasons ?? [])
      for (const season of seasonNumbers) {
        if (watched) nextWatched.add(season)
        else nextWatched.delete(season)
      }
      const completed = aired.length > 0 && aired.every((season) => nextWatched.has(season))
      const status = seasonStatus(completed, nextWatched, current)

      if (current?.status !== status || current.seasonCount !== aired.length) {
        await libraryRepository.upsert({ ...toSummary(series), status, seasonCount: aired.length })
      }
      await libraryRepository.setSeasonsWatched(series.tmdbId, seasonNumbers, watched)
    },
    optimistic:
      ({ series, seasonNumbers, watched, current }) =>
      (items) => {
        const seasons = new Set(current?.watchedSeasons ?? [])
        for (const season of seasonNumbers) {
          if (watched) seasons.add(season)
          else seasons.delete(season)
        }
        const aired = airedRegularSeasons(series.seasons).map((season) => season.seasonNumber)
        const completed = aired.length > 0 && aired.every((season) => seasons.has(season))
        return upsertLocal(items, {
          ...toSummary(series),
          seasonCount: aired.length,
          status: seasonStatus(completed, seasons, current),
          watchedAt: completed ? new Date().toISOString() : null,
          watchedSeasons: [...seasons].sort((a, b) => a - b),
        })
      },
    errorMessage: 'Impossible de mettre à jour les saisons.',
  })
}
