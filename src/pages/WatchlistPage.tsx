/**
 * Page « À voir » (/watchlist).
 *
 * Liste les films et séries que l'utilisateur a mis de côté pour plus tard,
 * avec un filtre par type conservé dans l'URL.
 */
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
import { t } from '@/features/i18n/i18n'

// Valeurs autorisées pour le filtre de type (toute autre valeur d'URL est ignorée).
const TYPES = ['all', 'movie', 'tv'] as const

/** Affiche les titres « à voir » de la bibliothèque, filtrables par type. */
export function WatchlistPage() {
  const library = useLibrary()
  const [type, setType] = useFilterParam('type', TYPES, 'all')
  const items = library.data ? filterLibrary(library.data, 'watchlist', type) : []

  return (
    <>
      <PageHeader title={t('watchlist.title')} subtitle={t('watchlist.subtitle')}>
        <TypeFilter value={type} onChange={setType} />
      </PageHeader>

      {library.isPending && <MediaGridSkeleton />}
      {library.isError && (
        <ErrorState
          message={getUserMessage(library.error, t('watchlist.loadError'))}
          onRetry={() => void library.refetch()}
        />
      )}
      {library.isSuccess &&
        (items.length > 0 ? (
          <MediaGrid items={items} />
        ) : (
          <EmptyState
            icon={Bookmark}
            title={t('watchlist.emptyTitle')}
            description={t('watchlist.emptyText')}
          />
        ))}
    </>
  )
}
