import { Clapperboard } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/cn'
import { posterSrcSet, posterUrl } from '@/lib/tmdbImage'

interface PosterImageProps {
  path: string | null
  title: string
  /** CSS `sizes` hint for responsive images. */
  sizes?: string
  className?: string
  priority?: boolean
  /** Thumbnails: the fallback shows the icon only. */
  compact?: boolean
}

/** Stable hue per title, so placeholders are varied but never change. */
function hueFor(title: string): number {
  let hash = 0
  for (const char of title) hash = (hash * 31 + char.charCodeAt(0)) % 360
  return hash
}

/**
 * 2:3 poster with a designed fallback when the image is missing or fails.
 * Width is set by the caller.
 */
export function PosterImage({
  path,
  title,
  sizes = '185px',
  className,
  priority = false,
  compact = false,
}: PosterImageProps) {
  const [failed, setFailed] = useState(false)
  const src = posterUrl(path)
  const hue = hueFor(title)

  return (
    <div
      className={cn(
        'relative aspect-[2/3] overflow-hidden rounded-lg bg-surface-raised ring-1 ring-border',
        className,
      )}
    >
      {src && !failed ? (
        <img
          src={src}
          srcSet={posterSrcSet(path)}
          sizes={sizes}
          alt={`Affiche de ${title}`}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => {
            setFailed(true)
          }}
          className="size-full object-cover"
        />
      ) : (
        <div
          role="img"
          aria-label={`Pas d’affiche pour ${title}`}
          className="flex size-full flex-col items-center justify-center gap-2 p-3 text-center"
          style={{
            backgroundImage: `linear-gradient(160deg, hsl(${String(hue)} 45% 30%), hsl(${String((hue + 50) % 360)} 45% 9%))`,
          }}
        >
          <Clapperboard
            aria-hidden="true"
            className={cn('text-white/70', compact ? 'size-4' : 'size-6')}
          />
          {!compact && (
            <span className="line-clamp-3 text-xs font-semibold text-white/85">{title}</span>
          )}
        </div>
      )}
    </div>
  )
}
