/**
 * Bouton d'action rapide de la bibliothèque (« À voir », « En cours », « Vu »).
 *
 * Utilisé sur les pages de détail et dans les résultats de recherche. Il affiche
 * un état visuel (inactif, chargement, déjà fait, désactivé) fourni par le hook
 * `useMediaActions`, et ne déclenche l'action que lorsqu'elle est possible.
 */
import { Check, Play, Plus } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/cn'
import type { ActionState } from '../hooks/useMediaActions'

interface ActionButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  kind: 'watchlist' | 'watching' | 'watched'
  state: ActionState
  label: string
  onRun: () => void
  size?: 'sm' | 'md'
  /** Écrans étroits : icône seule (le libellé reste lisible par les lecteurs d'écran). */
  iconOnlyOnMobile?: boolean
  /** Toujours icône seule (listes compactes) ; le libellé devient une infobulle. */
  iconOnly?: boolean
}

/**
 * Bouton rond d'une action de bibliothèque. L'icône dépend du type d'action
 * (`kind`) et le style de l'état (`state`) ; `onRun` n'est appelé qu'à l'état
 * « idle » pour éviter les doubles clics pendant une requête.
 */
export function ActionButton({
  kind,
  state,
  label,
  onRun,
  size = 'md',
  iconOnlyOnMobile = false,
  iconOnly = false,
  className,
  ...props
}: ActionButtonProps) {
  const done = state === 'done'
  const Icon = kind === 'watchlist' ? Plus : kind === 'watching' ? Play : Check

  return (
    <button
      type="button"
      // Accessibilité : on utilise `aria-disabled` plutôt que `disabled` pour que
      // le bouton reste focusable et annoncé ; `aria-busy` signale le chargement
      // et `aria-pressed` indique que l'action est déjà appliquée.
      aria-disabled={state !== 'idle'}
      aria-busy={state === 'loading'}
      aria-pressed={done}
      title={iconOnly ? label : undefined}
      onClick={(event) => {
        // Le bouton peut se trouver dans une carte cliquable : on empêche le
        // clic de remonter jusqu'au lien parent.
        event.stopPropagation()
        if (state === 'idle') onRun()
      }}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-full font-medium whitespace-nowrap transition',
        size === 'sm' ? 'h-8 px-3 text-xs' : 'h-11 px-5 text-sm',
        iconOnlyOnMobile && 'max-sm:size-9 max-sm:px-0',
        iconOnly && 'size-8 px-0',
        state === 'idle' &&
          (kind === 'watched'
            ? 'bg-accent text-accent-fg hover:brightness-110'
            : 'bg-fg/10 text-fg ring-1 ring-border hover:bg-fg/15'),
        done && 'cursor-default bg-success/15 text-success ring-1 ring-success/30',
        (state === 'loading' || state === 'disabled') && 'cursor-wait bg-fg/10 text-fg-muted',
        className,
      )}
      {...props}
    >
      {state === 'loading' ? (
        <Spinner className="size-4" />
      ) : (
        <Icon aria-hidden="true" className="size-4" strokeWidth={done ? 3 : 2} />
      )}
      {/* Le libellé est masqué visuellement (sr-only) mais reste lu par les lecteurs d'écran. */}
      <span className={cn(iconOnlyOnMobile && 'max-sm:sr-only', iconOnly && 'sr-only')}>
        {label}
      </span>
    </button>
  )
}
