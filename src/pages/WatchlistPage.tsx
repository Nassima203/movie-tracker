import { Bookmark } from 'lucide-react'
import { MediaGrid, MediaGridSkeleton } from '@/components/media/MediaGrid'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { PageHeader } from '@/components/ui/PageHeader'
import { TypeFilter } from '@/features/library/components/TypeFilter'
import { useFilterParam } from '@/features/library/hooks/useFilterParam'
import { useLibrary } from '@/features/library/hooks/useLibrary'
import { filterLibrary } from '@/features/library/selectors'
import { getUserMessage } from '@/lib/errors'

const TYPES = ['all', 'movie', 'tv'] as const

export function WatchlistPage() {
  const library = useLibrary()
  const [type, setType] = useFilterParam('type', TYPES, 'all')
  const items = library.data ? filterLibrary(library.data, 'watchlist', type) : []

  return (
    <>
      <PageHeader title="À voir" subtitle="Les films et séries que vous voulez regarder.">
        <TypeFilter value={type} onChange={setType} />
      </PageHeader>

      {library.isPending && <MediaGridSkeleton />}
      {library.isError && (
        <ErrorState
          message={getUserMessage(library.error, 'Impossible de charger votre liste.')}
          onRetry={() => void library.refetch()}
        />
      )}
      {library.isSuccess &&
        (items.length > 0 ? (
          <MediaGrid items={items} />
        ) : (
          <EmptyState
            icon={Bookmark}
            title="Votre liste est vide"
            description="Utilisez « À voir » depuis la recherche pour garder un titre de côté."
          />
        ))}
    </>
  )
}
