/**
 * Squelette de chargement de la page de détail d'un film ou d'une série :
 * des blocs gris animés à la place de l'affiche et du texte en attendant TMDB.
 */
import { Skeleton } from '@/components/ui/Skeleton'

/** Affiché pendant le chargement des détails, avec la même mise en page que `DetailHero`. */
export function DetailSkeleton() {
  return (
    // Accessibilité : `role="status"` + `aria-label` annoncent « Chargement »
    // aux lecteurs d'écran (les blocs gris, eux, sont masqués).
    <div
      role="status"
      aria-label="Chargement"
      className="flex flex-col gap-6 pt-6 sm:flex-row sm:items-end"
    >
      <Skeleton className="aspect-[2/3] w-40 sm:w-56" />
      <div className="flex flex-1 flex-col gap-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-4 w-full max-w-xl" />
        <Skeleton className="h-4 w-5/6 max-w-xl" />
      </div>
    </div>
  )
}
