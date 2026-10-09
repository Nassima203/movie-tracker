/**
 * Hook de la page de détail d'une série : met à jour le nombre de saisons
 * enregistré dans la bibliothèque quand il ne correspond plus à TMDB.
 */
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { libraryQueryKey, useLibraryUserId } from '@/features/library/hooks/useLibrary'
import { airedRegularSeasons } from '@/features/library/progress'
import { libraryRepository } from '@/features/library/repository'
import { logDevError } from '@/lib/errors'
import type { LibraryItem, SeriesDetails } from '@/types/media'

/**
 * Garde le nombre de saisons enregistré (utilisé pour la progression dans les
 * listes) synchronisé avec TMDB à l'ouverture de la page d'une série, par
 * exemple après la diffusion d'une nouvelle saison.
 */
export function useSyncSeasonCount(series: SeriesDetails | undefined, item: LibraryItem | null) {
  const queryClient = useQueryClient()
  const userId = useLibraryUserId()
  // Seules les saisons régulières déjà diffusées comptent (ni saison 0, ni saisons à venir).
  const airedCount = series ? airedRegularSeasons(series.seasons).length : null
  const needsSync = series !== undefined && item !== null && item.seasonCount !== airedCount

  useEffect(() => {
    if (!needsSync || airedCount === null) return
    libraryRepository
      .upsert({ ...series, status: item.status, seasonCount: airedCount })
      // Une fois enregistré, on recharge la bibliothèque pour afficher la bonne progression.
      .then(() => queryClient.invalidateQueries({ queryKey: libraryQueryKey(userId) }))
      .catch((error: unknown) => {
        // Échec silencieux pour l'utilisateur : ce n'est qu'une mise à jour d'arrière-plan.
        logDevError('season count sync failed', error)
      })
    // On ne relance l'effet que lorsque le décalage lui-même change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsSync, airedCount])
}
