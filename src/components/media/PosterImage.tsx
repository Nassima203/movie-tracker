/**
 * Affiche (poster) d'un film ou d'une série, au format 2:3, chargée depuis le
 * CDN d'images de TMDB, avec une image de remplacement soignée si besoin.
 */
import { Clapperboard } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/cn'
import { posterSrcSet, posterUrl } from '@/lib/tmdbImage'

interface PosterImageProps {
  path: string | null
  title: string
  /** Indication CSS `sizes` pour les images responsives. */
  sizes?: string
  className?: string
  /** Image visible dès l'arrivée sur la page : chargée immédiatement (pas en différé). */
  priority?: boolean
  /** Miniatures : l'image de remplacement n'affiche que l'icône. */
  compact?: boolean
}

/** Teinte stable par titre : les images de remplacement sont variées mais ne changent jamais. */
function hueFor(title: string): number {
  let hash = 0
  // Petit hachage du titre, ramené à un angle de teinte entre 0 et 359.
  for (const char of title) hash = (hash * 31 + char.charCodeAt(0)) % 360
  return hash
}

/**
 * Affiche 2:3 avec une image de remplacement quand l'image est absente ou ne
 * se charge pas. La largeur est fixée par le composant parent.
 */
export function PosterImage({
  path,
  title,
  sizes = '185px',
  className,
  priority = false,
  compact = false,
}: PosterImageProps) {
  // Passe à true si le chargement de l'image échoue (on affiche alors le remplacement).
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
          // `lazy` : les affiches hors écran ne sont téléchargées qu'en s'en approchant.
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => {
            setFailed(true)
          }}
          className="size-full object-cover"
        />
      ) : (
        // Accessibilité : `role="img"` + `aria-label` font annoncer ce bloc comme
        // une image, avec un texte expliquant l'absence d'affiche.
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
