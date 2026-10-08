import { Skeleton } from '@/components/ui/Skeleton'
import { mediaKey, type LibraryItem, type MediaSummary } from '@/types/media'
import { PosterCard } from './PosterCard'

const GRID =
  'grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'

interface MediaGridProps {
  items: MediaSummary[]
  /** Library entries by media key, to show the user's status on each poster. */
  library?: Map<string, LibraryItem>
}

export function MediaGrid({ items, library }: MediaGridProps) {
  return (
    <ul className={GRID}>
      {items.map((media) => {
        const key = mediaKey(media)
        const item = library?.get(key) ?? (isLibraryItem(media) ? media : null)
        return (
          <li key={key} className="animate-fade-in">
            <PosterCard media={media} item={item} />
          </li>
        )
      })}
    </ul>
  )
}

function isLibraryItem(media: MediaSummary): media is LibraryItem {
  return 'status' in media
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
