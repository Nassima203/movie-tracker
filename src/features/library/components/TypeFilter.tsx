/**
 * Filtre « Films / Séries » des pages de la bibliothèque, construit à partir du
 * composant générique `FilterChips`.
 */
import type { TypeFilter as TypeFilterValue } from '../selectors'
import { FilterChips } from './FilterChips'

/** Permet de n'afficher que les films, que les séries, ou les deux. */
export function TypeFilter({
  value,
  onChange,
}: {
  value: TypeFilterValue
  onChange: (value: TypeFilterValue) => void
}) {
  return (
    <FilterChips
      label="Type"
      value={value}
      onChange={onChange}
      options={[
        { value: 'all', label: 'Films et séries' },
        { value: 'movie', label: 'Films' },
        { value: 'tv', label: 'Séries' },
      ]}
    />
  )
}
