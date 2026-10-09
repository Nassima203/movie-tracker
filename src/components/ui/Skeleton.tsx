/**
 * Bloc gris animé qui réserve la place d'un contenu en cours de chargement.
 */
import { cn } from '@/lib/cn'

/**
 * Bloc de chargement décoratif (aria-hidden) : c'est le conteneur parent qui
 * annonce « Chargement » aux lecteurs d'écran.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-lg bg-fg/8', className)} />
}
