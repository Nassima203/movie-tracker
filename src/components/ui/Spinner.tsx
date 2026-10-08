import { LoaderCircle } from 'lucide-react'
import { cn } from '@/lib/cn'

interface SpinnerProps {
  className?: string
}

/** Decorative spinner: the surrounding element is responsible for announcing state. */
export function Spinner({ className }: SpinnerProps) {
  return <LoaderCircle aria-hidden="true" className={cn('size-5 animate-spin', className)} />
}
