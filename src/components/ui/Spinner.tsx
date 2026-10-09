/**
 * Icône de chargement qui tourne.
 */
import { LoaderCircle } from 'lucide-react'
import { cn } from '@/lib/cn'

interface SpinnerProps {
  className?: string
}

/** Spinner décoratif : c'est l'élément qui l'entoure qui doit annoncer l'état. */
export function Spinner({ className }: SpinnerProps) {
  return <LoaderCircle aria-hidden="true" className={cn('size-5 animate-spin', className)} />
}
