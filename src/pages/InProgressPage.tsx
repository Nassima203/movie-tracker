/**
 * Page « En cours » (/in-progress).
 *
 * Liste les films et séries que l'utilisateur est en train de regarder, avec
 * un filtre par type (tout / films / séries) conservé dans l'URL.
 */
import { Play } from 'lucide-react'
import { MediaGrid, MediaGridSkeleton } from '@/components/media/MediaGrid'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { PageHeader } from '@/components/ui/PageHeader'
import { TypeFilter } from '@/features/library/components/TypeFilter'
import { useFilterParam } from '@/features/library/hooks/useFilterParam'
import { useLibrary } from '@/features/library/hooks/useLibrary'
import { filterLibrary } from '@/features/library/selectors'
import { getUserMessage } from '@/lib/errors'

// Valeurs autorisées pour le filtre de type (toute autre valeur d'URL est ignorée).
const TYPES = ['all', 'movie', 'tv'] as const

/** Affiche les titres « en cours » de la bibliothèque, filtrables par type. */
export function InProgressPage() {
  const library = useLibrary()
  const [type, setType] = useFilterParam('type', TYPES, 'all')
  const items = library.data ? filterLibrary(library.data, 'in_progress', type) : []

  return (
    <>
      <PageHeader
        title="En cours"
        subtitle="Les films et séries que vous êtes en train de regarder."
      >
        <TypeFilter value={type} onChange={setType} />
      </PageHeader>

      {library.isPending && <MediaGridSkeleton />}
      {library.isError && (
        <ErrorState
          message={getUserMessage(library.error, 'Impossible de charger vos titres en cours.')}
          onRetry={() => void library.refetch()}
        />
      )}
      {library.isSuccess &&
        (items.length > 0 ? (
          <MediaGrid items={items} />
        ) : (
          <EmptyState
            icon={Play}
            title="Rien en cours"
            description="Utilisez « En cours » depuis la recherche, ou cochez une saison d’une série."
          />
        ))}
    </>
  )
}
