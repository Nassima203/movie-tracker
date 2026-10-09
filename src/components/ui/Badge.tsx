/**
 * Petite étiquette arrondie (ex. : « Film », « Série », « Démo »), composant
 * d'interface réutilisable.
 */
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Variante de couleur de l'étiquette. */
type BadgeTone = 'neutral' | 'accent' | 'success'

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-surface-overlay text-fg ring-border',
  accent: 'bg-accent text-accent-fg ring-transparent',
  success: 'bg-success/15 text-success ring-success/30',
}

/** Étiquette courte ; `tone` choisit les couleurs (neutre par défaut). */
export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide ring-1 backdrop-blur-sm',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
