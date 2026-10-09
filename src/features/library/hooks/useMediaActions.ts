import type { LibraryItem, MediaSummary } from '@/types/media'
import { categorize } from '../progress'
import { useAddToWatchlist, useMarkWatched, useMarkWatching } from './useLibraryActions'

export type ActionState = 'idle' | 'loading' | 'done' | 'disabled'

export interface MediaAction {
  state: ActionState
  label: string
  run: () => void
}

export interface MediaActions {
  watchlist: MediaAction
  watching: MediaAction
  watched: MediaAction
}

/**
 * Non-destructive quick actions (search results, detail pages): they add an
 * entry or move it forward (à voir → en cours → vu). Removal is a separate,
 * explicit action.
 */
export function useMediaActions(media: MediaSummary, item: LibraryItem | null): MediaActions {
  const addToWatchlist = useAddToWatchlist()
  const markWatching = useMarkWatching()
  const markWatched = useMarkWatched()
  const category = item ? categorize(item) : null
  const busy = addToWatchlist.isPending || markWatching.isPending || markWatched.isPending

  const inLibrary = item !== null
  const isWatching = category === 'in_progress'
  const isWatched = category === 'watched'

  function stateOf(pending: boolean, done: boolean): ActionState {
    if (pending) return 'loading'
    if (done) return 'done'
    return busy ? 'disabled' : 'idle'
  }

  return {
    watchlist: {
      state: stateOf(addToWatchlist.isPending, inLibrary),
      label: inLibrary
        ? category === 'watchlist'
          ? 'Dans ma liste'
          : 'Dans la bibliothèque'
        : 'À voir',
      run: () => {
        if (!inLibrary && !busy) addToWatchlist.mutate(media)
      },
    },
    watching: {
      // A finished title is not moved back automatically.
      state: stateOf(markWatching.isPending, isWatching || isWatched),
      label: 'En cours',
      run: () => {
        if (!isWatching && !isWatched && !busy) markWatching.mutate(media)
      },
    },
    watched: {
      state: stateOf(markWatched.isPending, isWatched),
      label: isWatched ? 'Vu' : 'Marquer vu',
      run: () => {
        if (!isWatched && !busy) markWatched.mutate(media)
      },
    },
  }
}
