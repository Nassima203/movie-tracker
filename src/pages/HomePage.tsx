import { ArrowRight, Clapperboard, Search } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { MediaGrid, MediaGridSkeleton } from '@/components/media/MediaGrid'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { useLibrary } from '@/features/library/hooks/useLibrary'
import { byRecentWatch, filterLibrary } from '@/features/library/selectors'
import { getUserMessage } from '@/lib/errors'
import type { LibraryItem } from '@/types/media'

const SECTION_SIZE = 12

function Section({ title, to, items }: { title: string; to: string; items: LibraryItem[] }) {
  if (items.length === 0) return null
  return (
    <section aria-label={title} className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <Link
          to={to}
          className="inline-flex items-center gap-1 rounded text-sm text-fg-muted hover:text-accent"
        >
          Tout voir <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
      <MediaGrid items={items.slice(0, SECTION_SIZE)} />
    </section>
  )
}

function Hero({ children }: { children?: ReactNode }) {
  return (
    <div className="mb-10 flex flex-col gap-3 pt-4">
      <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
        Ce que vous avez vu,
        <br />
        <span className="text-accent">ce que vous voulez voir.</span>
      </h1>
      {children}
    </div>
  )
}

export function HomePage() {
  const library = useLibrary()

  if (library.isPending) {
    return (
      <>
        <Hero />
        <MediaGridSkeleton count={6} />
      </>
    )
  }

  if (library.isError) {
    return (
      <ErrorState
        message={getUserMessage(library.error, 'Impossible de charger votre bibliothèque.')}
        onRetry={() => void library.refetch()}
      />
    )
  }

  const items = library.data
  const inProgress = filterLibrary(items, 'in_progress', 'all')
  const watchlist = filterLibrary(items, 'watchlist', 'all')
  const watched = filterLibrary(items, 'watched', 'all').sort(byRecentWatch)

  return (
    <>
      <Hero>
        <p className="max-w-xl text-fg-muted">
          {items.length === 0
            ? 'Votre bibliothèque est vide. Recherchez un premier film ou une série pour commencer.'
            : `${String(inProgress.length)} série${inProgress.length > 1 ? 's' : ''} en cours · ${String(watchlist.length)} à voir · ${String(watched.length)} vu${watched.length > 1 ? 's' : ''}`}
        </p>
      </Hero>

      {items.length === 0 ? (
        <EmptyState
          icon={Clapperboard}
          title="Rien ici pour l’instant"
          description="Ajoutez des titres à votre liste « À voir » ou marquez-les comme vus depuis la recherche."
          action={
            <Link
              to="/search"
              className="mt-2 inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-accent-fg hover:brightness-110"
            >
              <Search aria-hidden="true" className="size-4" /> Rechercher
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-12">
          <Section title="Séries en cours" to="/library?status=in_progress" items={inProgress} />
          <Section title="À voir" to="/watchlist" items={watchlist} />
          <Section title="Vus récemment" to="/library?status=watched" items={watched} />
        </div>
      )}
    </>
  )
}
