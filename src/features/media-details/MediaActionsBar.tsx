/**
 * Barre d'actions de la page de détail : boutons « À voir », « En cours »,
 * « Vu » et, si le titre est déjà dans la bibliothèque, « Retirer ».
 */
import { ActionButton } from '@/features/library/components/ActionButton'
import { RemoveButton } from '@/features/library/components/RemoveButton'
import { useMediaActions } from '@/features/library/hooks/useMediaActions'
import type { LibraryItem, MediaSummary } from '@/types/media'

/** Affiche les actions de bibliothèque d'un film ou d'une série. */
export function MediaActionsBar({
  media,
  item,
}: {
  media: MediaSummary
  item: LibraryItem | null
}) {
  const actions = useMediaActions(media, item)

  return (
    <>
      <ActionButton
        kind="watchlist"
        state={actions.watchlist.state}
        label={actions.watchlist.label}
        onRun={actions.watchlist.run}
      />
      <ActionButton
        kind="watching"
        state={actions.watching.state}
        label={actions.watching.label}
        onRun={actions.watching.run}
      />
      <ActionButton
        kind="watched"
        state={actions.watched.state}
        // Pour une série, on précise que l'action coche toutes les saisons diffusées.
        label={
          media.mediaType === 'tv' && actions.watched.state === 'idle'
            ? 'Tout marquer vu'
            : actions.watched.label
        }
        onRun={actions.watched.run}
      />
      {item && <RemoveButton media={item} title={media.title} />}
    </>
  )
}
