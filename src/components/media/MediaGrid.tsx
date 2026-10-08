import { Skeleton } from '@/components/ui/Skeleton'
import { mediaKey, type LibraryItem } from '@/types/media'
import { PosterCard } from './PosterCard'

const GRID =
  'grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'

export function MediaGrid({ items }: { items: LibraryItem[] }) {
  return (
    <ul className={GRID}>
      {items.map((item) => (
        <li key={mediaKey(item)} className="animate-fade-in">
          <PosterCard item={item} />
        </li>
      ))}
    </ul>
  )
}

export function MediaGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className={GRID} role="status" aria-label="Chargement">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex flex-col gap-2">
          <Skeleton className="aspect-[2/3] w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  )
}
