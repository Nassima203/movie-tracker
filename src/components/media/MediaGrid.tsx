/**
 * Grille d'affiches de films et de séries (accueil, recherche, listes de la
 * bibliothèque), et son squelette de chargement.
 */
import { Skeleton } from '@/components/ui/Skeleton'
import { mediaKey, type LibraryItem, type MediaSummary } from '@/types/media'
import { PosterCard } from './PosterCard'

// Classes de la grille, partagées par la grille et son squelette pour qu'ils aient
// exactement la même mise en page (pas de « saut » à la fin du chargement).
const GRID =
  'grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'

interface MediaGridProps {
  items: MediaSummary[]
  /** Entrées de la bibliothèque par clé de média, pour afficher le statut de l'utilisateur sur chaque affiche. */
  library?: Map<string, LibraryItem>
}

/** Affiche une liste de titres sous forme de grille d'affiches responsive. */
export function MediaGrid({ items, library }: MediaGridProps) {
  return (
    <ul className={GRID}>
      {items.map((media) => {
        const key = mediaKey(media)
        // Le statut vient de l'index de la bibliothèque, ou du titre lui-même
        // quand la grille affiche directement des entrées de la bibliothèque.
        const item = library?.get(key) ?? (isLibraryItem(media) ? media : null)
        return (
          <li key={key} className="animate-fade-in">
            <PosterCard media={media} item={item} />
          </li>
        )
      })}
    </ul>
  )
}

/** Garde de type : vrai si l'objet est une entrée de bibliothèque (il a un `status`). */
function isLibraryItem(media: MediaSummary): media is LibraryItem {
  return 'status' in media
}

/** Version « chargement » de la grille : des affiches grises animées. */
export function MediaGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className={GRID} role="status" aria-label="Chargement">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex flex-col gap-2">
          <Skeleton className="aspect-[2/3] w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  )
}
