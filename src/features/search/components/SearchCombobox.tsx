import { CircleAlert, Search, SearchX, X } from 'lucide-react'
import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router'
import { mediaPath } from '@/components/media/mediaPath'
import { Skeleton } from '@/components/ui/Skeleton'
import { Spinner } from '@/components/ui/Spinner'
import { indexLibrary, useLibrary } from '@/features/library/hooks/useLibrary'
import { cn } from '@/lib/cn'
import { getUserMessage } from '@/lib/errors'
import { mediaKey, type MediaSummary } from '@/types/media'
import { useTmdbSearch, type TmdbSearchState } from '../hooks/useTmdbSearch'
import { SEARCH_COLUMNS, SearchResultRow } from './SearchResultRow'

interface SearchComboboxProps {
  /** `popover`: header dropdown. `inline`: full search page, results always shown. */
  variant: 'popover' | 'inline'
  autoFocus?: boolean
  maxResults?: number
  /** Larger input, e.g. in the home page hero. Defaults to large for `inline`. */
  size?: 'md' | 'lg'
}

interface ActiveCell {
  row: number
  column: number
}

function announce(search: TmdbSearchState): string {
  switch (search.status) {
    case 'loading':
      return 'Recherche en cours'
    case 'empty':
      return 'Aucun résultat'
    case 'error':
      return 'La recherche a échoué'
    case 'success':
      return `${String(search.results.length)} résultat${search.results.length > 1 ? 's' : ''}`
    case 'idle':
      return ''
  }
}

/**
 * Search box following the WAI-ARIA combobox pattern with a grid popup:
 * ↑/↓ move between results, ←/→ between [open] [À voir] [Vu],
 * Enter activates, Escape closes (then clears), Tab leaves.
 */
export function SearchCombobox({
  variant,
  autoFocus = false,
  maxResults = 8,
  size = variant === 'inline' ? 'lg' : 'md',
}: SearchComboboxProps) {
  const [input, setInput] = useState('')
  const [isOpen, setIsOpen] = useState(variant === 'inline')
  const [active, setActive] = useState<ActiveCell | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const baseId = useId()
  const gridId = `${baseId}-grid`
  const cellId = (row: number, column: number) => `${baseId}-r${String(row)}-c${String(column)}`

  const search = useTmdbSearch(input)
  const library = indexLibrary(useLibrary().data)
  const results = search.results.slice(0, maxResults)
  const showPopup = (variant === 'inline' || isOpen) && search.status !== 'idle'
  const activeCell = showPopup && active && active.row < results.length ? active : null

  function close() {
    if (variant === 'popover') setIsOpen(false)
    setActive(null)
  }

  function open(media: MediaSummary) {
    close()
    void navigate(mediaPath(media))
  }

  function activate(cell: ActiveCell) {
    const element = document.getElementById(cellId(cell.row, cell.column))
    const target = element?.querySelector('button') ?? element
    target?.click()
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault()
        setIsOpen(true)
        if (results.length === 0) return
        setActive((current) => ({
          row: current ? Math.min(current.row + 1, results.length - 1) : 0,
          column: current?.column ?? 0,
        }))
        return
      }
      case 'ArrowUp': {
        if (!activeCell) return
        event.preventDefault()
        setActive(activeCell.row === 0 ? null : { ...activeCell, row: activeCell.row - 1 })
        return
      }
      case 'ArrowRight':
      case 'ArrowLeft': {
        if (!activeCell) return // keep native caret movement in the input
        event.preventDefault()
        const delta = event.key === 'ArrowRight' ? 1 : -1
        const column = Math.min(Math.max(activeCell.column + delta, 0), SEARCH_COLUMNS - 1)
        setActive({ ...activeCell, column })
        return
      }
      case 'Enter': {
        if (!activeCell) return
        event.preventDefault()
        activate(activeCell)
        return
      }
      case 'Escape': {
        if (showPopup && variant === 'popover') {
          event.preventDefault()
          close()
        } else if (input) {
          event.preventDefault()
          setInput('')
          setActive(null)
        }
        return
      }
      case 'Tab':
        close()
        return
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      onBlur={(event) => {
        if (!containerRef.current?.contains(event.relatedTarget)) close()
      }}
    >
      <div
        className={cn(
          'flex items-center gap-2 rounded-full border border-border bg-surface-overlay px-4 backdrop-blur-md transition focus-within:border-accent/60 focus-within:bg-surface-raised',
          size === 'lg' ? 'h-14' : 'h-11',
        )}
      >
        <Search aria-hidden="true" className="size-5 shrink-0 text-fg-muted" />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-label="Rechercher un film ou une série"
          aria-expanded={showPopup}
          aria-controls={gridId}
          aria-haspopup="grid"
          aria-autocomplete="list"
          aria-activedescendant={activeCell ? cellId(activeCell.row, activeCell.column) : undefined}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="search"
          autoFocus={autoFocus}
          placeholder="Rechercher un film ou une série"
          value={input}
          onChange={(event) => {
            setInput(event.target.value)
            setIsOpen(true)
            setActive(null)
          }}
          onFocus={() => {
            setIsOpen(true)
          }}
          onKeyDown={onKeyDown}
          className={cn(
            'min-w-0 flex-1 bg-transparent outline-none placeholder:text-fg-muted [&::-webkit-search-cancel-button]:hidden',
            size === 'lg' ? 'text-lg' : 'text-sm',
          )}
        />
        {search.isRefreshing && <Spinner className="size-4 text-fg-muted" />}
        {input && (
          <button
            type="button"
            aria-label="Effacer la recherche"
            onClick={() => {
              setInput('')
              setActive(null)
              inputRef.current?.focus()
            }}
            className="rounded-full p-1 text-fg-muted hover:text-fg"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        )}
      </div>

      <p role="status" className="sr-only">
        {announce(search)}
      </p>

      {showPopup && (
        <div
          // Keeps focus in the input when clicking inside the popup.
          onMouseDown={(event) => {
            event.preventDefault()
          }}
          className={cn(
            variant === 'popover'
              ? 'absolute inset-x-0 top-full z-40 mt-2 max-h-[70vh] animate-pop-in overflow-y-auto rounded-2xl border border-border bg-surface-raised/95 p-2 shadow-2xl shadow-black/50 backdrop-blur-xl'
              : 'mt-4',
          )}
        >
          {search.status === 'loading' && <SearchSkeleton rows={variant === 'inline' ? 6 : 3} />}

          {search.status === 'error' && (
            <div className="flex flex-col items-center gap-3 px-4 py-8 text-center text-sm">
              <CircleAlert aria-hidden="true" className="size-6 text-danger" />
              <p>{getUserMessage(search.error, 'La recherche a échoué.')}</p>
              <button
                type="button"
                onClick={search.retry}
                className="rounded-full bg-fg/10 px-4 py-2 font-medium hover:bg-fg/15"
              >
                Réessayer
              </button>
            </div>
          )}

          {search.status === 'empty' && (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-fg-muted">
              <SearchX aria-hidden="true" className="size-6" />
              <p>
                Aucun résultat pour « <span className="text-fg">{search.query}</span> »
              </p>
            </div>
          )}

          <div
            id={gridId}
            role="grid"
            aria-label="Résultats de recherche"
            aria-rowcount={results.length}
            hidden={search.status !== 'success'}
            className="flex flex-col gap-1"
          >
            {search.status === 'success' &&
              results.map((media, row) => (
                <SearchResultRow
                  key={mediaKey(media)}
                  media={media}
                  item={library.get(mediaKey(media)) ?? null}
                  rowIndex={row}
                  activeColumn={activeCell?.row === row ? activeCell.column : null}
                  cellId={cellId}
                  onOpen={open}
                  onHover={(hoverRow, column) => {
                    setActive({ row: hoverRow, column })
                  }}
                  size={variant === 'inline' ? 'large' : 'compact'}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SearchSkeleton({ rows }: { rows: number }) {
  return (
    <div className="flex flex-col gap-1" aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3 px-3 py-2">
          <Skeleton className="aspect-[2/3] w-11 shrink-0" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  )
}
