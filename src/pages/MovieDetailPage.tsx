import { useParams } from 'react-router'
import { ErrorState } from '@/components/ui/ErrorState'
import { useMovieDetails } from '@/features/catalog/hooks/useMediaDetails'
import { useLibraryItem } from '@/features/library/hooks/useLibrary'
import { DetailHero } from '@/features/media-details/DetailHero'
import { DetailSkeleton } from '@/features/media-details/DetailSkeleton'
import { MediaActionsBar } from '@/features/media-details/MediaActionsBar'
import { getUserMessage } from '@/lib/errors'
import { formatRuntime } from '@/lib/format'
import { parseTmdbIdParam } from './params'
import { NotFoundPage } from './NotFoundPage'

export function MovieDetailPage() {
  const tmdbId = parseTmdbIdParam(useParams()['id'])
  return tmdbId === null ? <NotFoundPage /> : <MovieDetail tmdbId={tmdbId} />
}

function MovieDetail({ tmdbId }: { tmdbId: number }) {
  const movie = useMovieDetails(tmdbId)
  const { item } = useLibraryItem({ mediaType: 'movie', tmdbId })

  if (movie.isPending) return <DetailSkeleton />
  if (movie.isError) {
    return (
      <ErrorState
        message={getUserMessage(movie.error, 'Impossible de charger ce film.')}
        onRetry={() => void movie.refetch()}
      />
    )
  }

  return (
    <DetailHero media={movie.data} meta={[formatRuntime(movie.data.runtimeMinutes)]}>
      <MediaActionsBar media={movie.data} item={item} />
    </DetailHero>
  )
}
