/**
 * Calculs de progression et de catégorie des titres de la bibliothèque.
 *
 * Ces fonctions pures (sans effet de bord) décident par exemple si une série
 * est « en cours » ou « terminée » selon les saisons cochées. Elles sont
 * utilisées partout : listes, filtres, affiches, page de détail.
 */
import type { LibraryItem, SeasonSummary } from '@/types/media'

/**
 * Saisons régulières dont la diffusion a commencé. Les épisodes spéciaux
 * (saison 0) et les saisons annoncées sans date de diffusion (ou diffusées dans
 * le futur) ne sont pas comptés : on ne peut pas avoir « fini » une série dont
 * la saison suivante n'est pas encore sortie.
 */
export function airedRegularSeasons(seasons: SeasonSummary[], today = new Date()): SeasonSummary[] {
  // Date du jour au format AAAA-MM-JJ, comparable directement aux dates TMDB
  // (l'ordre alphabétique des chaînes ISO correspond à l'ordre chronologique).
  const todayIso = today.toISOString().slice(0, 10)
  return seasons.filter(
    (season) => season.seasonNumber > 0 && season.airDate !== null && season.airDate <= todayIso,
  )
}

/** État de progression d'une série (`unknown` : nombre total de saisons inconnu). */
type SeriesProgressState = 'not_started' | 'in_progress' | 'completed' | 'unknown'

/** Progression d'une série : saisons vues, total, état et ratio pour la barre. */
interface SeriesProgress {
  watched: number
  total: number | null
  state: SeriesProgressState
  /** Entre 0 et 1, null quand le total est inconnu. */
  ratio: number | null
}

/**
 * Calcule la progression d'une série à partir des saisons vues et du nombre de
 * saisons diffusées enregistré (`seasonCount`).
 */
export function computeSeriesProgress(
  item: Pick<LibraryItem, 'watchedSeasons' | 'seasonCount'>,
): SeriesProgress {
  // La saison 0 (épisodes spéciaux) est exclue : elle ne compte pas dans la progression.
  const watched = item.watchedSeasons.filter((season) => season > 0).length
  const total = item.seasonCount

  // Total inconnu : impossible de calculer un pourcentage.
  if (total === null || total === 0) {
    return { watched, total, state: watched > 0 ? 'in_progress' : 'unknown', ratio: null }
  }

  // On plafonne au total : des saisons cochées peuvent dépasser un `seasonCount`
  // pas encore mis à jour, et la barre ne doit jamais dépasser 100 %.
  const counted = Math.min(watched, total)
  const state = counted === 0 ? 'not_started' : counted >= total ? 'completed' : 'in_progress'
  return { watched: counted, total, state, ratio: counted / total }
}

/** Catégorie de bibliothèque utilisée par les listes et les filtres. */
export type LibraryCategory = 'watchlist' | 'in_progress' | 'watched'

/**
 * Range un titre dans une catégorie (« à voir », « en cours », « vu »). Pour un
 * film, c'est simplement son statut ; pour une série, la progression compte aussi.
 */
export function categorize(item: LibraryItem): LibraryCategory {
  if (item.mediaType === 'movie') {
    return item.status === 'watching' ? 'in_progress' : item.status
  }

  // Séries : les saisons décident d'abord, puis le statut choisi par l'utilisateur.
  const progress = computeSeriesProgress(item)
  if (progress.state === 'completed') return 'watched'
  if (progress.state === 'in_progress' || item.status === 'watching') return 'in_progress'
  return item.status === 'watched' ? 'watched' : 'watchlist'
}
