/**
 * Groupe de « puces » de filtre (boutons arrondis) pour les pages de la
 * bibliothèque. Composant générique réutilisé par les filtres de type et de
 * catégorie.
 */
import { cn } from '@/lib/cn'

interface FilterChipsProps<T extends string> {
  label: string
  options: { value: T; label: string; count?: number }[]
  value: T
  onChange: (value: T) => void
}

/**
 * Filtre à choix unique affiché comme un groupe de boutons bascule. Le type
 * générique `T` garantit que seules les valeurs prévues peuvent être choisies.
 */
export function FilterChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: FilterChipsProps<T>) {
  return (
    // Accessibilité : `role="group"` + `aria-label` regroupe les boutons sous un
    // nom commun, et `aria-pressed` annonce le bouton sélectionné.
    <div role="group" aria-label={label} className="flex scrollbar-none gap-2 overflow-x-auto">
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => {
              onChange(option.value)
            }}
            className={cn(
              'inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition',
              selected
                ? 'bg-fg text-surface'
                : 'bg-surface-overlay text-fg-muted ring-1 ring-border backdrop-blur-md hover:text-fg',
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span className={cn('text-xs', selected ? 'text-surface/70' : 'text-fg-muted')}>
                {option.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
