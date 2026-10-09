import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { MediaGrid, MediaGridSkeleton } from '@/components/media/MediaGrid'
import { ErrorState } from '@/components/ui/ErrorState'
import { useTrending } from '@/features/catalog/hooks/useMediaDetails'
import { indexLibrary, useLibrary } from '@/features/library/hooks/useLibrary'
import { byRecentWatch, filterLibrary } from '@/features/library/selectors'
import { SearchCombobox } from '@/features/search/components/SearchCombobox'
import { getUserMessage } from '@/lib/errors'
import type { LibraryItem } from '@/types/media'

const SECTION_SIZE = 6

function LibrarySection({ title, to, items }: { title: string; to: string; items: LibraryItem[] }) {
  if (items.length === 0) return null
  return (
    <section aria-label={title} className="flex flex-col gap-4">
      <SectionHeading title={title} to={to} />
      <MediaGrid items={items.slice(0, SECTION_SIZE)} />
    </section>
  )
}

function SectionHeading({ title, to }: { title: string; to?: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {to && (
        <Link
          to={to}
          className="inline-flex items-center gap-1 rounded text-sm text-fg-muted hover:text-accent"
        >
          Tout voir <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      )}
    </div>
  )
}

function TrendingSection({ library }: { library: Map<string, LibraryItem> }) {
  const trending = useTrending()

  return (
    <section aria-label="Tendances de la semaine" className="flex flex-col gap-4">
      <SectionHeading title="Tendances de la semaine" />
      {trending.isPending && <MediaGridSkeleton count={12} />}
      {trending.isError && (
        <ErrorState
          message={getUserMessage(trending.error, 'Impossible de charger les tendances.')}
          onRetry={() => void trending.refetch()}
        />
      )}
      {trending.isSuccess && <MediaGrid items={trending.data} library={library} />}
    </section>
  )
}

export function HomePage() {
  const library = useLibrary()
  const items = library.data ?? []
  const inProgress = filterLibrary(items, 'in_progress', 'all')
  const watchlist = filterLibrary(items, 'watchlist', 'all')
  const watched = filterLibrary(items, 'watched', 'all').sort(byRecentWatch)

  return (
    <>
      <section className="mb-12 flex flex-col gap-5 pt-4 sm:pt-10">
        <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-5xl">
          Ce que vous avez vu,
          <br />
          <span className="text-accent">ce que vous voulez voir.</span>
        </h1>
        <div className="max-w-2xl">
          <SearchCombobox variant="popover" size="lg" />
        </div>
        {library.isSuccess && items.length > 0 && (
          <p className="text-sm text-fg-muted">
            {inProgress.length} en cours · {watchlist.length} à voir · {watched.length} vu
            {watched.length > 1 ? 's' : ''}
          </p>
        )}
      </section>

      {library.isError && (
        <div className="mb-12">
          <ErrorState
            message={getUserMessage(library.error, 'Impossible de charger votre bibliothèque.')}
            onRetry={() => void library.refetch()}
          />
        </div>
      )}

      <div className="flex flex-col gap-12">
        <LibrarySection title="En cours" to="/in-progress" items={inProgress} />
        <LibrarySection title="À voir" to="/watchlist" items={watchlist} />
        <TrendingSection library={indexLibrary(library.data)} />
        <LibrarySection title="Vus récemment" to="/library?status=watched" items={watched} />
      </div>
    </>
  )
}
