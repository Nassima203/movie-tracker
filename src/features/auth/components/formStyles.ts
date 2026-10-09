import { cn } from '@/lib/cn'

export function inputClass(hasError: boolean): string {
  return cn(
    'h-12 w-full rounded-xl border bg-surface px-4 text-base text-fg outline-none transition placeholder:text-fg-muted',
    'focus-visible:border-accent focus-visible:outline-none',
    hasError ? 'border-danger' : 'border-border',
  )
}
