import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { libraryQueryKey, useLibraryUserId } from '@/features/library/hooks/useLibrary'
import { airedRegularSeasons } from '@/features/library/progress'
import { libraryRepository } from '@/features/library/repository'
import { logDevError } from '@/lib/errors'
import type { LibraryItem, SeriesDetails } from '@/types/media'

/**
 * Keeps the stored season count (used for progress in lists) in sync with TMDB
 * when a series page is opened, e.g. after a new season has aired.
 */
export function useSyncSeasonCount(series: SeriesDetails | undefined, item: LibraryItem | null) {
  const queryClient = useQueryClient()
  const userId = useLibraryUserId()
  const airedCount = series ? airedRegularSeasons(series.seasons).length : null
  const needsSync = series !== undefined && item !== null && item.seasonCount !== airedCount

  useEffect(() => {
    if (!needsSync || airedCount === null) return
    libraryRepository
      .upsert({ ...series, status: item.status, seasonCount: airedCount })
      .then(() => queryClient.invalidateQueries({ queryKey: libraryQueryKey(userId) }))
      .catch((error: unknown) => {
        logDevError('season count sync failed', error)
      })
    // Only re-run when the mismatch itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsSync, airedCount])
}
