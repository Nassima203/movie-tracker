import { Check, Plus } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/cn'
import type { ActionState } from '../hooks/useMediaActions'

interface ActionButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  kind: 'watchlist' | 'watched'
  state: ActionState
  label: string
  onRun: () => void
  size?: 'sm' | 'md'
  /** Narrow screens: icon only (the label stays available to screen readers). */
  iconOnlyOnMobile?: boolean
}

export function ActionButton({
  kind,
  state,
  label,
  onRun,
  size = 'md',
  iconOnlyOnMobile = false,
  className,
  ...props
}: ActionButtonProps) {
  const done = state === 'done'
  const Icon = kind === 'watchlist' ? Plus : Check

  return (
    <button
      type="button"
      aria-disabled={state !== 'idle'}
      aria-busy={state === 'loading'}
      aria-pressed={done}
      onClick={(event) => {
        event.stopPropagation()
        if (state === 'idle') onRun()
      }}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-full font-medium whitespace-nowrap transition',
        size === 'sm' ? 'h-8 px-3 text-xs' : 'h-11 px-5 text-sm',
        iconOnlyOnMobile && 'max-sm:size-9 max-sm:px-0',
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
      <span className={cn(iconOnlyOnMobile && 'max-sm:sr-only')}>{label}</span>
    </button>
  )
}
