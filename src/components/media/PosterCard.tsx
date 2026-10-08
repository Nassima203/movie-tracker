import { Bookmark, Check } from 'lucide-react'
import { Link } from 'react-router'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { categorize, computeSeriesProgress } from '@/features/library/progress'
import { formatYear, mediaTypeLabel } from '@/lib/format'
import type { LibraryItem, MediaSummary } from '@/types/media'
import { mediaPath } from './mediaPath'
import { PosterImage } from './PosterImage'

const GRID_SIZES = '(min-width: 1280px) 185px, (min-width: 768px) 20vw, 45vw'

interface PosterCardProps {
  media: MediaSummary
  /** The user's library entry for this media, when there is one. */
  item: LibraryItem | null
}

export function PosterCard({ media, item }: PosterCardProps) {
  const year = formatYear(media.releaseDate)
  const progress = item?.mediaType === 'tv' ? computeSeriesProgress(item) : null
  const category = item ? categorize(item) : null

  return (
    <Link
      to={mediaPath(media)}
      className="group flex flex-col gap-2 rounded-xl focus-visible:outline-offset-4"
    >
      <div className="relative transition duration-200 group-hover:-translate-y-1 group-hover:shadow-2xl group-hover:shadow-black/40">
        <PosterImage
          path={media.posterPath}
          title={media.title}
          sizes={GRID_SIZES}
          className="w-full"
        />
        <div className="absolute top-2 left-2 flex gap-1">
          <Badge>{mediaTypeLabel(media.mediaType)}</Badge>
        </div>
        {category === 'watched' && (
          <span className="absolute top-2 right-2 inline-flex size-6 items-center justify-center rounded-full bg-accent text-accent-fg shadow">
            <Check aria-hidden="true" className="size-4" strokeWidth={3} />
            <span className="sr-only">Vu</span>
          </span>
        )}
        {category === 'watchlist' && (
          <span className="absolute top-2 right-2 inline-flex size-6 items-center justify-center rounded-full bg-surface-overlay text-accent shadow ring-1 ring-border backdrop-blur-sm">
            <Bookmark aria-hidden="true" className="size-3.5" strokeWidth={2.5} />
            <span className="sr-only">À voir</span>
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-1">
        <p className="truncate text-sm font-medium group-hover:text-accent">{media.title}</p>
        <p className="text-xs text-fg-muted">
          {[
            year,
            progress?.total
              ? `${String(progress.watched)}/${String(progress.total)} saisons`
              : null,
          ]
            .filter(Boolean)
            .join(' · ') || ' '}
        </p>
        {progress?.total ? (
          <ProgressBar
            value={progress.watched}
            max={progress.total}
            label={`Progression de ${media.title}`}
          />
        ) : null}
      </div>
    </Link>
  )
}
