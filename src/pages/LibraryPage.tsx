/**
 * Page « Bibliothèque » (/library).
 *
 * Vue d'ensemble de tous les titres suivis, filtrables par statut (en cours,
 * à voir, vus) et par type. Les filtres sont stockés dans l'URL pour pouvoir
 * partager ou recharger la page sans les perdre.
 */
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
import { t } from '@/features/i18n/i18n'

// Valeurs autorisées pour les filtres lus dans l'URL.
const STATUSES = ['all', 'in_progress', 'watchlist', 'watched'] as const
const TYPES = ['all', 'movie', 'tv'] as const

/** Affiche toute la bibliothèque avec filtres de statut et de type, et le nombre de titres par statut. */
export function LibraryPage() {
  const library = useLibrary()
  const [status, setStatus] = useFilterParam('status', STATUSES, 'all')
  const [type, setType] = useFilterParam('type', TYPES, 'all')

  const all = library.data ?? []
  const counts = countByCategory(all)
  const items = filterLibrary(all, status, type)

  return (
    <>
      <PageHeader title={t('library.title')} subtitle={t('library.subtitle')}>
        <TypeFilter value={type} onChange={setType} />
      </PageHeader>

      <div className="mb-6">
        <FilterChips
          label={t('filter.status')}
          value={status}
          onChange={setStatus}
          options={[
            { value: 'all', label: t('filter.all'), count: all.length },
            { value: 'in_progress', label: t('filter.inProgress'), count: counts.in_progress },
            { value: 'watchlist', label: t('filter.toWatch'), count: counts.watchlist },
            { value: 'watched', label: t('filter.watched'), count: counts.watched },
          ]}
        />
      </div>

      {library.isPending && <MediaGridSkeleton />}
      {library.isError && (
        <ErrorState
          message={getUserMessage(library.error, t('library.loadError'))}
          onRetry={() => void library.refetch()}
        />
      )}
      {library.isSuccess &&
        (items.length > 0 ? (
          <MediaGrid items={items} />
        ) : (
          <EmptyState
            icon={Library}
            title={t('library.emptyTitle')}
            // On distingue « bibliothèque vide » de « filtres trop restrictifs ».
            description={all.length === 0 ? t('library.emptyText') : t('library.noMatch')}
          />
        ))}
    </>
  )
}
