import type { TypeFilter as TypeFilterValue } from '../selectors'
import { FilterChips } from './FilterChips'

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
