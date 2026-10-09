/**
 * En-tête (« hero ») des pages de détail d'un film ou d'une série : image de
 * fond, affiche, titre, informations, synopsis et emplacement pour les actions.
 */
import type { ReactNode } from 'react'
import { PosterImage } from '@/components/media/PosterImage'
import { Badge } from '@/components/ui/Badge'
import { formatYear, mediaTypeLabel } from '@/lib/format'
import { backdropUrl } from '@/lib/tmdbImage'
import type { MediaDetails } from '@/types/media'

interface DetailHeroProps {
  media: MediaDetails
  /** Informations courtes affichées après l'année (durée, nombre de saisons…) ; null est ignoré. */
  meta: (string | null)[]
  /** Boutons d'action affichés sous le synopsis. */
  children: ReactNode
}

/** Grand en-tête de la page de détail, partagé par les films et les séries. */
export function DetailHero({ media, meta, children }: DetailHeroProps) {
  const backdrop = backdropUrl(media.backdropPath)
  const year = formatYear(media.releaseDate)

  return (
    <section className="relative -mx-4 -mt-6 mb-10 overflow-hidden px-4 pt-8 pb-8 sm:-mx-6 sm:px-6 sm:pt-12">
      {/* Image de fond purement décorative : masquée aux lecteurs d'écran (alt vide,
          aria-hidden). Les dégradés par-dessus gardent le texte lisible. */}
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
