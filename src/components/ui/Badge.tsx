import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type BadgeTone = 'neutral' | 'accent' | 'success'

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-surface-overlay text-fg ring-border',
  accent: 'bg-accent text-accent-fg ring-transparent',
  success: 'bg-success/15 text-success ring-success/30',
}

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
