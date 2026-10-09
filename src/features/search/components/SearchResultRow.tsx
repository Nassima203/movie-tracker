/**
 * Une ligne de résultat dans la liste de recherche : affiche, titre, type,
 * année, et trois boutons d'action rapide (À voir, En cours, Vu).
 *
 * Elle fait partie d'une « grille » ARIA pilotée au clavier par `SearchCombobox`.
 */
import { PosterImage } from '@/components/media/PosterImage'
import { Badge } from '@/components/ui/Badge'
import { ActionButton } from '@/features/library/components/ActionButton'
import { useMediaActions } from '@/features/library/hooks/useMediaActions'
import { cn } from '@/lib/cn'
import { formatYear, mediaTypeLabel } from '@/lib/format'
import type { LibraryItem, MediaSummary } from '@/types/media'

/**
 * Nombre de colonnes (cellules navigables) par ligne : [ouvrir] [À voir] [En cours] [Vu].
 * `SearchCombobox` s'en sert pour borner la navigation avec ←/→.
 */
export const SEARCH_COLUMNS = 4

interface SearchResultRowProps {
  media: MediaSummary
  /** L'entrée correspondante dans la liste de l'utilisateur, ou `null` si le titre n'y est pas. */
  item: LibraryItem | null
  /** Position de la ligne dans la grille (commence à 0). */
  rowIndex: number
  /** Colonne mise en évidence par le clavier dans cette ligne, ou `null` si la ligne n'est pas active. */
  activeColumn: number | null
  /** Génère l'identifiant HTML unique d'une cellule (utilisé par aria-activedescendant). */
  cellId: (row: number, column: number) => string
  onOpen: (media: MediaSummary) => void
  /** Appelé au survol de la souris pour synchroniser la cellule active avec le pointeur. */
  onHover: (row: number, column: number) => void
  size: 'compact' | 'large'
}

/**
 * Une ligne de la grille du menu de recherche : [ouvrir] [À voir] [En cours] [Vu].
 * Le focus reste dans le champ de saisie (aria-activedescendant) ; les cellules
 * s'activent avec Entrée ou au pointeur, donc les boutons d'action sont retirés
 * de l'ordre de tabulation (`tabIndex={-1}`).
 */
export function SearchResultRow({
  media,
  item,
  rowIndex,
  activeColumn,
  cellId,
  onOpen,
  onHover,
  size,
}: SearchResultRowProps) {
  const actions = useMediaActions(media, item)
  const year = formatYear(media.releaseDate)

  // Encadre la cellule active pour que la navigation au clavier soit visible.
  const cellClass = (column: number) =>
    cn(
      'rounded-lg',
      activeColumn === column && 'ring-2 ring-accent ring-offset-2 ring-offset-surface-raised',
    )

  return (
    <div
      role="row"
      aria-rowindex={rowIndex + 1}
      className={cn(
        'flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors',
        activeColumn !== null && 'bg-fg/6',
      )}
    >
      <div
        id={cellId(rowIndex, 0)}
        role="gridcell"
        aria-selected={activeColumn === 0}
        onClick={() => {
          onOpen(media)
        }}
        onMouseEnter={() => {
          onHover(rowIndex, 0)
        }}
        className={cn('flex min-w-0 flex-1 cursor-pointer items-center gap-3 p-1', cellClass(0))}
      >
        <PosterImage
          path={media.posterPath}
          title={media.title}
          sizes={size === 'large' ? '64px' : '44px'}
          compact
          className={cn('shrink-0 rounded-md', size === 'large' ? 'w-16' : 'w-11')}
        />
        <div className="min-w-0">
          <p className="truncate font-medium">{media.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-fg-muted">
            <Badge>{mediaTypeLabel(media.mediaType)}</Badge>
            {year && <span>{year}</span>}
            {media.originalTitle && <span className="truncate italic">{media.originalTitle}</span>}
          </div>
        </div>
      </div>

      <div
        id={cellId(rowIndex, 1)}
        role="gridcell"
        aria-selected={activeColumn === 1}
        className={cellClass(1)}
        onMouseEnter={() => {
          onHover(rowIndex, 1)
        }}
      >
        <ActionButton
          kind="watchlist"
          size="sm"
          iconOnlyOnMobile
          iconOnly={size === 'compact'}
          tabIndex={-1}
          state={actions.watchlist.state}
          label={actions.watchlist.label}
          onRun={actions.watchlist.run}
          aria-label={`${actions.watchlist.label} : ${media.title}`}
        />
      </div>

      <div
        id={cellId(rowIndex, 2)}
        role="gridcell"
        aria-selected={activeColumn === 2}
        className={cellClass(2)}
        onMouseEnter={() => {
          onHover(rowIndex, 2)
        }}
      >
        <ActionButton
          kind="watching"
          size="sm"
          iconOnlyOnMobile
          iconOnly={size === 'compact'}
          tabIndex={-1}
          state={actions.watching.state}
          label={actions.watching.label}
          onRun={actions.watching.run}
          aria-label={`${actions.watching.label} : ${media.title}`}
        />
      </div>
      <div
        id={cellId(rowIndex, 3)}
        role="gridcell"
        aria-selected={activeColumn === 3}
        className={cellClass(3)}
        onMouseEnter={() => {
          onHover(rowIndex, 3)
        }}
      >
        <ActionButton
          kind="watched"
          size="sm"
          iconOnlyOnMobile
          iconOnly={size === 'compact'}
          tabIndex={-1}
          state={actions.watched.state}
          label={actions.watched.label}
          onRun={actions.watched.run}
          aria-label={`${actions.watched.label} : ${media.title}`}
        />
      </div>
    </div>
  )
}
