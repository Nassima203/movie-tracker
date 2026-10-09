/**
 * Hooks de modification de la bibliothèque (ajouter, marquer en cours / vu,
 * retirer, cocher des saisons).
 *
 * Toutes ces actions utilisent des « mises à jour optimistes » : l'interface
 * change immédiatement, sans attendre la réponse du serveur, puis revient en
 * arrière si la requête échoue. L'application paraît ainsi instantanée.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/toast/useToast'
import { catalog, catalogKeys, DETAILS_STALE_TIME } from '@/features/catalog/catalog'
import { getUserMessage, logDevError } from '@/lib/errors'
import type {
  LibraryItem,
  LibraryStatus,
  MediaRef,
  MediaSummary,
  SeriesDetails,
} from '@/types/media'
import { airedRegularSeasons } from '../progress'
import { libraryRepository } from '../repository'
import { libraryQueryKey, useLibraryUserId } from './useLibrary'

/** Fonction qui calcule la nouvelle liste (en cache) à partir de l'ancienne. */
type Updater = (items: LibraryItem[]) => LibraryItem[]

/** Vrai si les deux références désignent le même titre (même type et même id TMDB). */
function sameMedia(a: MediaRef, b: MediaRef): boolean {
  return a.mediaType === b.mediaType && a.tmdbId === b.tmdbId
}

/**
 * Ne garde que les champs d'un résumé de média. L'objet reçu peut être plus
 * riche (ex. : détails complets d'une série) ; on évite d'envoyer le surplus.
 */
function toSummary(media: MediaSummary): MediaSummary {
  return {
    mediaType: media.mediaType,
    tmdbId: media.tmdbId,
    title: media.title,
    originalTitle: media.originalTitle,
    posterPath: media.posterPath,
    releaseDate: media.releaseDate,
  }
}

/**
 * Ajoute ou met à jour une entrée dans la copie locale (le cache) de la
 * bibliothèque. Imite ce que fera le serveur, pour la mise à jour optimiste.
 */
function upsertLocal(
  items: LibraryItem[],
  next: Partial<LibraryItem> & MediaSummary,
): LibraryItem[] {
  const now = new Date().toISOString()
  const existing = items.find((item) => sameMedia(item, next))
  // Ordre de fusion : valeurs par défaut, puis l'entrée existante, puis les
  // nouvelles valeurs (chaque niveau écrase le précédent).
  const merged: LibraryItem = {
    status: 'watchlist',
    seasonCount: null,
    addedAt: now,
    watchedAt: null,
    watchedSeasons: [],
    ...existing,
    ...next,
    updatedAt: now,
  }
  // L'entrée modifiée passe en tête de liste (tri par date de mise à jour).
  return [merged, ...items.filter((item) => item !== existing)]
}

/**
 * Mécanique commune des mises à jour optimistes : le cache est modifié tout de
 * suite, restauré en cas d'échec (avec une notification) puis resynchronisé
 * avec le serveur dans tous les cas.
 */
function useOptimisticLibraryMutation<TVariables>(options: {
  mutationFn: (variables: TVariables) => Promise<void>
  optimistic: (variables: TVariables) => Updater
  errorMessage: string
}) {
  const queryClient = useQueryClient()
  const userId = useLibraryUserId()
  const { notify } = useToast()
  const queryKey = libraryQueryKey(userId)

  return useMutation({
    mutationFn: options.mutationFn,
    // 1. Avant la requête : on applique le changement localement.
    onMutate: async (variables) => {
      // On annule les lectures en cours, sinon une réponse arrivée plus tard
      // pourrait écraser notre mise à jour optimiste avec des données périmées.
      await queryClient.cancelQueries({ queryKey })
      // On garde une copie de l'état actuel pour pouvoir revenir en arrière.
      const previous = queryClient.getQueryData<LibraryItem[]>(queryKey)
      queryClient.setQueryData<LibraryItem[]>(queryKey, (items) =>
        options.optimistic(variables)(items ?? []),
      )
      // Ce « contexte » est transmis à `onError`.
      return { previous }
    },
    // 2. En cas d'échec : retour arrière (rollback) vers la copie sauvegardée.
    onError: (error, _variables, context) => {
      logDevError(options.errorMessage, error)
      queryClient.setQueryData(queryKey, context?.previous)
      notify(getUserMessage(error, options.errorMessage), 'error')
    },
    // 3. Succès ou échec : on recharge depuis le serveur, qui fait foi.
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })
}

/**
 * Statut d'une série après un changement de saisons : toutes les saisons
 * diffusées vues → « vu », certaines → « en cours ».
 */
function seasonStatus(
  completed: boolean,
  watchedSeasons: Set<number>,
  current: LibraryItem | null,
): LibraryStatus {
  if (completed) return 'watched'
  // La saison 0 (épisodes spéciaux) ne compte pas comme un début de visionnage.
  if ([...watchedSeasons].some((season) => season > 0)) return 'watching'
  // Aucune saison vue : on conserve « en cours » si l'utilisateur l'avait choisi.
  return current?.status === 'watching' ? 'watching' : 'watchlist'
}

/** Ajoute un titre à la liste « À voir ». */
export function useAddToWatchlist() {
  return useOptimisticLibraryMutation({
    mutationFn: (media: MediaSummary) =>
      libraryRepository.upsert({ ...toSummary(media), status: 'watchlist' }),
    optimistic: (media) => (items) =>
      upsertLocal(items, { ...toSummary(media), status: 'watchlist', watchedAt: null }),
    errorMessage: 'Impossible d’ajouter ce titre à votre liste.',
  })
}

/** Marque un titre comme « En cours ». */
export function useMarkWatching() {
  return useOptimisticLibraryMutation({
    mutationFn: (media: MediaSummary) =>
      libraryRepository.upsert({ ...toSummary(media), status: 'watching' }),
    optimistic: (media) => (items) =>
      upsertLocal(items, { ...toSummary(media), status: 'watching', watchedAt: null }),
    errorMessage: 'Impossible de marquer ce titre comme en cours.',
  })
}

/**
 * Marque un titre comme « Vu ». Pour une série, toutes les saisons déjà
 * diffusées sont aussi cochées, afin que la progression soit cohérente.
 */
export function useMarkWatched() {
  const queryClient = useQueryClient()

  // Récupère les détails de la série (depuis le cache si possible) pour
  // connaître la liste de ses saisons.
  async function fetchSeries(tmdbId: number): Promise<SeriesDetails> {
    return queryClient.query({
      queryKey: catalogKeys.series(tmdbId),
      queryFn: ({ signal }) => catalog.getSeries(tmdbId, signal),
      staleTime: DETAILS_STALE_TIME,
    })
  }

  return useOptimisticLibraryMutation({
    mutationFn: async (media: MediaSummary) => {
      if (media.mediaType === 'movie') {
        await libraryRepository.upsert({ ...toSummary(media), status: 'watched' })
        return
      }

      // Une série marquée « vue » = toutes ses saisons régulières déjà diffusées sont vues.
      const details = await fetchSeries(media.tmdbId)
      const aired = airedRegularSeasons(details.seasons).map((season) => season.seasonNumber)
      // La série doit exister dans la bibliothèque avant d'enregistrer ses saisons.
      await libraryRepository.upsert({
        ...toSummary(details),
        status: 'watched',
        seasonCount: aired.length,
      })
      await libraryRepository.setSeasonsWatched(details.tmdbId, aired, true)
    },
    // L'affichage optimiste ne change que le statut : les saisons arriveront
    // avec le rechargement depuis le serveur (`onSettled`).
    optimistic: (media) => (items) =>
      upsertLocal(items, {
        ...toSummary(media),
        status: 'watched',
        watchedAt: new Date().toISOString(),
      }),
    errorMessage: 'Impossible de marquer ce titre comme vu.',
  })
}

/** Retire un titre de la bibliothèque (et la progression de ses saisons). */
export function useRemoveFromLibrary() {
  return useOptimisticLibraryMutation({
    mutationFn: (ref: MediaRef) => libraryRepository.remove(ref),
    optimistic: (ref) => (items) => items.filter((item) => !sameMedia(item, ref)),
    errorMessage: 'Impossible de retirer ce titre.',
  })
}

/** Paramètres de `useSetSeasonsWatched`. */
interface SetSeasonsVariables {
  series: SeriesDetails
  seasonNumbers: number[]
  watched: boolean
  /** Entrée actuelle de la série dans la bibliothèque, ou null si absente. */
  current: LibraryItem | null
}

/**
 * Coche ou décoche des saisons. Ajoute d'abord la série à la bibliothèque si
 * besoin, et garde le statut enregistré cohérent avec la progression.
 */
export function useSetSeasonsWatched() {
  return useOptimisticLibraryMutation({
    mutationFn: async ({ series, seasonNumbers, watched, current }: SetSeasonsVariables) => {
      // On calcule l'ensemble des saisons vues *après* le changement…
      const aired = airedRegularSeasons(series.seasons).map((season) => season.seasonNumber)
      const nextWatched = new Set(current?.watchedSeasons ?? [])
      for (const season of seasonNumbers) {
        if (watched) nextWatched.add(season)
        else nextWatched.delete(season)
      }
      // …pour en déduire le statut : « terminée » si toutes les saisons diffusées sont vues.
      const completed = aired.length > 0 && aired.every((season) => nextWatched.has(season))
      const status = seasonStatus(completed, nextWatched, current)

      // On ne réécrit l'entrée que si le statut ou le nombre de saisons change
      // (ou si la série n'est pas encore dans la bibliothèque).
      if (current?.status !== status || current.seasonCount !== aired.length) {
        await libraryRepository.upsert({ ...toSummary(series), status, seasonCount: aired.length })
      }
      await libraryRepository.setSeasonsWatched(series.tmdbId, seasonNumbers, watched)
    },
    // Même calcul que ci-dessus, appliqué au cache pour un affichage immédiat.
    optimistic:
      ({ series, seasonNumbers, watched, current }) =>
      (items) => {
        const seasons = new Set(current?.watchedSeasons ?? [])
        for (const season of seasonNumbers) {
          if (watched) seasons.add(season)
          else seasons.delete(season)
        }
        const aired = airedRegularSeasons(series.seasons).map((season) => season.seasonNumber)
        const completed = aired.length > 0 && aired.every((season) => seasons.has(season))
        return upsertLocal(items, {
          ...toSummary(series),
          seasonCount: aired.length,
          status: seasonStatus(completed, seasons, current),
          watchedAt: completed ? new Date().toISOString() : null,
          watchedSeasons: [...seasons].sort((a, b) => a - b),
        })
      },
    errorMessage: 'Impossible de mettre à jour les saisons.',
  })
}
