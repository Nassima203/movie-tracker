import { Library } from 'lucide-react'
import { MediaGrid, MediaGridSkeleton } from '@/components/media/MediaGrid'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { PageHeader } from '@/components/ui/PageHeader'
import { FilterChips } from '@/features/library/components/FilterChips'
import { TypeFilter } from '@/features/library/components/TypeFilter'
import { useFilterParam } from '@/features/library/hooks/useFilterParam'
import { useLibrary } from '@/features/library/hooks/useLibrary'
import { countByCategory, filterLibrary } from '@/features/library/selectors'
import { getUserMessage } from '@/lib/errors'

const STATUSES = ['all', 'in_progress', 'watchlist', 'watched'] as const
const TYPES = ['all', 'movie', 'tv'] as const

export function LibraryPage() {
  const library = useLibrary()
  const [status, setStatus] = useFilterParam('status', STATUSES, 'all')
  const [type, setType] = useFilterParam('type', TYPES, 'all')

  const all = library.data ?? []
  const counts = countByCategory(all)
  const items = filterLibrary(all, status, type)

  return (
    <>
      <PageHeader title="Bibliothèque" subtitle="Tout ce que vous suivez, au même endroit.">
        <TypeFilter value={type} onChange={setType} />
      </PageHeader>

      <div className="mb-6">
        <FilterChips
          label="Statut"
          value={status}
          onChange={setStatus}
          options={[
            { value: 'all', label: 'Tout', count: all.length },
            { value: 'in_progress', label: 'En cours', count: counts.in_progress },
            { value: 'watchlist', label: 'À voir', count: counts.watchlist },
            { value: 'watched', label: 'Vus', count: counts.watched },
          ]}
        />
      </div>

      {library.isPending && <MediaGridSkeleton />}
      {library.isError && (
        <ErrorState
          message={getUserMessage(library.error, 'Impossible de charger votre bibliothèque.')}
          onRetry={() => void library.refetch()}
        />
      )}
      {library.isSuccess &&
        (items.length > 0 ? (
          <MediaGrid items={items} />
        ) : (
          <EmptyState
            icon={Library}
            title="Aucun titre"
            description={
              all.length === 0
                ? 'Votre bibliothèque est vide.'
                : 'Aucun titre ne correspond à ces filtres.'
            }
          />
        ))}
    </>
  )
}
