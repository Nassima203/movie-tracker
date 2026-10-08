import { cn } from '@/lib/cn'

interface ProgressBarProps {
  value: number
  max: number
  label: string
  className?: string
}

export function ProgressBar({ value, max, label, className }: ProgressBarProps) {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-fg/10', className)}
    >
      <div
        className="h-full rounded-full bg-accent transition-[width] duration-300"
        style={{ width: `${String(percent)}%` }}
      />
    </div>
  )
}
