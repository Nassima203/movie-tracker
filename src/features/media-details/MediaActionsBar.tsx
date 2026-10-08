import { ActionButton } from '@/features/library/components/ActionButton'
import { RemoveButton } from '@/features/library/components/RemoveButton'
import { useMediaActions } from '@/features/library/hooks/useMediaActions'
import type { LibraryItem, MediaSummary } from '@/types/media'

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
        kind="watched"
        state={actions.watched.state}
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
