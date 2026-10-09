/**
 * Hook qui prépare les trois actions rapides d'un titre (« À voir »,
 * « En cours », « Vu ») : leur état, leur libellé et la fonction à appeler.
 * Les composants n'ont plus qu'à afficher le résultat (voir `ActionButton`).
 */
import type { LibraryItem, MediaSummary } from '@/types/media'
import { categorize } from '../progress'
import { useAddToWatchlist, useMarkWatched, useMarkWatching } from './useLibraryActions'

/**
 * État d'un bouton d'action : `idle` (cliquable), `loading` (requête en cours),
 * `done` (déjà appliqué) ou `disabled` (une autre action est en cours).
 */
export type ActionState = 'idle' | 'loading' | 'done' | 'disabled'

/** Une action prête à afficher : état, libellé et fonction à exécuter. */
interface MediaAction {
  state: ActionState
  label: string
  run: () => void
}

/** Les trois actions rapides d'un titre. */
interface MediaActions {
  watchlist: MediaAction
  watching: MediaAction
  watched: MediaAction
}

/**
 * Actions rapides non destructives (résultats de recherche, pages de détail) :
 * elles ajoutent une entrée ou la font avancer (à voir → en cours → vu). Le
 * retrait est une action séparée et explicite.
 */
export function useMediaActions(media: MediaSummary, item: LibraryItem | null): MediaActions {
  const addToWatchlist = useAddToWatchlist()
  const markWatching = useMarkWatching()
  const markWatched = useMarkWatched()
  const category = item ? categorize(item) : null
  // Une seule action à la fois : tant qu'une requête est en cours, les autres
  // boutons sont désactivés pour éviter des états contradictoires.
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
      // Un titre terminé n'est pas ramené automatiquement à « en cours ».
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
