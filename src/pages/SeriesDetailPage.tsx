/**
 * Page de détail d'une série (/series/:id).
 *
 * Lit l'identifiant TMDB dans l'URL, charge la série, affiche son en-tête
 * avec les actions de bibliothèque, puis la liste des saisons à cocher.
 */
import { useParams } from 'react-router'
import { ErrorState } from '@/components/ui/ErrorState'
import { useSeriesDetails } from '@/features/catalog/hooks/useMediaDetails'
import { useLibraryItem } from '@/features/library/hooks/useLibrary'
import { airedRegularSeasons } from '@/features/library/progress'
import { DetailHero } from '@/features/media-details/DetailHero'
import { DetailSkeleton } from '@/features/media-details/DetailSkeleton'
import { MediaActionsBar } from '@/features/media-details/MediaActionsBar'
import { SeasonList } from '@/features/media-details/SeasonList'
import { useSyncSeasonCount } from '@/features/media-details/useSyncSeasonCount'
import { getUserMessage } from '@/lib/errors'
import { pluralize } from '@/lib/format'
import { parseTmdbIdParam } from './params'
import { NotFoundPage } from './NotFoundPage'

/** Valide l'id de l'URL : page introuvable s'il est invalide, sinon le détail de la série. */
export function SeriesDetailPage() {
  const tmdbId = parseTmdbIdParam(useParams()['id'])
  return tmdbId === null ? <NotFoundPage /> : <SeriesDetail tmdbId={tmdbId} />
}

// Contenu de la page, séparé pour n'appeler les hooks de données qu'avec un id valide.
function SeriesDetail({ tmdbId }: { tmdbId: number }) {
  const series = useSeriesDetails(tmdbId)
  const item = useLibraryItem({ mediaType: 'tv', tmdbId })
  // Met à jour dans la bibliothèque le nombre de saisons si la série en a de nouvelles.
  useSyncSeasonCount(series.data, item)

  if (series.isPending) return <DetailSkeleton />
  if (series.isError) {
    return (
      <ErrorState
        message={getUserMessage(series.error, 'Impossible de charger cette série.')}
        onRetry={() => void series.refetch()}
      />
    )
  }

  // On ne compte que les saisons régulières déjà diffusées (pas les spéciaux
  // ni les saisons annoncées).
  const airedCount = airedRegularSeasons(series.data.seasons).length

  return (
    <>
      <DetailHero
        media={series.data}
        meta={[
          airedCount > 0 ? pluralize(airedCount, 'saison', 'saisons') : null,
          series.data.inProduction ? 'En production' : null,
        ]}
      >
        <MediaActionsBar media={series.data} item={item} />
      </DetailHero>
      <SeasonList series={series.data} item={item} />
    </>
  )
}
