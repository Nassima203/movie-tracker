import type { ReactNode } from 'react'
import { PosterImage } from '@/components/media/PosterImage'
import { Badge } from '@/components/ui/Badge'
import { formatYear, mediaTypeLabel } from '@/lib/format'
import { backdropUrl } from '@/lib/tmdbImage'
import type { MediaDetails } from '@/types/media'

interface DetailHeroProps {
  media: MediaDetails
  meta: (string | null)[]
  children: ReactNode
}

export function DetailHero({ media, meta, children }: DetailHeroProps) {
  const backdrop = backdropUrl(media.backdropPath)
  const year = formatYear(media.releaseDate)

  return (
    <section className="relative -mx-4 -mt-6 mb-10 overflow-hidden px-4 pt-8 pb-8 sm:-mx-6 sm:px-6 sm:pt-12">
      {backdrop && (
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <img src={backdrop} alt="" className="size-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/80 to-surface/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-surface/90 to-transparent" />
        </div>
      )}

      <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
        <PosterImage
          path={media.posterPath}
          title={media.title}
          sizes="(min-width: 640px) 220px, 160px"
          priority
          className="w-40 shrink-0 shadow-2xl shadow-black/50 sm:w-56"
        />

        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-fg-muted">
            <Badge>{mediaTypeLabel(media.mediaType)}</Badge>
            {[year, ...meta].filter(Boolean).map((value) => (
              <span key={value}>{value}</span>
            ))}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-5xl">
            {media.title}
          </h1>
          {media.originalTitle && (
            <p className="text-sm text-fg-muted italic">{media.originalTitle}</p>
          )}
          {media.genres.length > 0 && (
            <p className="text-sm text-fg-muted">{media.genres.join(' · ')}</p>
          )}
          {media.overview && (
            <p className="max-w-2xl leading-relaxed text-fg/90">{media.overview}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">{children}</div>
        </div>
      </div>
    </section>
  )
}
