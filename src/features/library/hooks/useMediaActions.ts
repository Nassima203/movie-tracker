import type { LibraryItem, MediaSummary } from '@/types/media'
import { categorize } from '../progress'
import { useAddToWatchlist, useMarkWatched } from './useLibraryActions'

export type ActionState = 'idle' | 'loading' | 'done' | 'disabled'

export interface MediaActions {
  watchlist: { state: ActionState; label: string; run: () => void }
  watched: { state: ActionState; label: string; run: () => void }
}

/**
 * Non-destructive quick actions (search results, detail pages): they only add
 * or upgrade an entry. Removal is an explicit, separate action.
 */
export function useMediaActions(media: MediaSummary, item: LibraryItem | null): MediaActions {
  const addToWatchlist = useAddToWatchlist()
  const markWatched = useMarkWatched()
  const category = item ? categorize(item) : null
  const busy = addToWatchlist.isPending || markWatched.isPending

  const inLibrary = item !== null
  const isWatched = category === 'watched'

  return {
    watchlist: {
      state: addToWatchlist.isPending ? 'loading' : inLibrary ? 'done' : busy ? 'disabled' : 'idle',
      label: inLibrary ? (isWatched ? 'Dans la bibliothèque' : 'Dans ma liste') : 'À voir',
      run: () => {
        if (!inLibrary && !busy) addToWatchlist.mutate(media)
      },
    },
    watched: {
      state: markWatched.isPending ? 'loading' : isWatched ? 'done' : busy ? 'disabled' : 'idle',
      label: isWatched ? 'Vu' : 'Marquer vu',
      run: () => {
        if (!isWatched && !busy) markWatched.mutate(media)
      },
    },
  }
}
