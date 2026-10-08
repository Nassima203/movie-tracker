import type { LibraryItem, MediaType } from '@/types/media'
import { categorize, type LibraryCategory } from './progress'

export type CategoryFilter = LibraryCategory | 'all'
export type TypeFilter = MediaType | 'all'

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

export function byRecentWatch(a: LibraryItem, b: LibraryItem): number {
  return (b.watchedAt ?? b.updatedAt).localeCompare(a.watchedAt ?? a.updatedAt)
}

export function countByCategory(items: LibraryItem[]): Record<LibraryCategory, number> {
  const counts: Record<LibraryCategory, number> = { watchlist: 0, in_progress: 0, watched: 0 }
  for (const item of items) counts[categorize(item)] += 1
  return counts
}
