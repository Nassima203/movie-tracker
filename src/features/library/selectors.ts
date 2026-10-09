/**
 * Fonctions de filtrage, de tri et de comptage de la bibliothèque, utilisées
 * par les pages de listes (« À voir », « En cours », « Bibliothèque »).
 */
import type { LibraryItem, MediaType } from '@/types/media'
import { categorize, type LibraryCategory } from './progress'

/** Filtre par catégorie ; `all` affiche tout. */
type CategoryFilter = LibraryCategory | 'all'

/** Filtre par type de média (film ou série) ; `all` affiche tout. */
export type TypeFilter = MediaType | 'all'

/** Ne garde que les titres correspondant à la catégorie et au type demandés. */
export function filterLibrary(
  items: LibraryItem[],
  category: CategoryFilter,
  type: TypeFilter,
): LibraryItem[] {
  return items.filter(
    (item) =>
      (category === 'all' || categorize(item) === category) &&
      (type === 'all' || item.mediaType === type),
  )
}

/**
 * Fonction de tri (pour `Array.sort`) : les titres vus le plus récemment en
 * premier. À défaut de date de visionnage, on utilise la date de mise à jour.
 */
export function byRecentWatch(a: LibraryItem, b: LibraryItem): number {
  return (b.watchedAt ?? b.updatedAt).localeCompare(a.watchedAt ?? a.updatedAt)
}

/** Nombre de titres par catégorie (affiché à côté des filtres). */
export function countByCategory(items: LibraryItem[]): Record<LibraryCategory, number> {
  const counts: Record<LibraryCategory, number> = { watchlist: 0, in_progress: 0, watched: 0 }
  for (const item of items) counts[categorize(item)] += 1
  return counts
}
