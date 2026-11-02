/**
 * Filtre « Films / Séries » des pages de la bibliothèque, construit à partir du
 * composant générique `FilterChips`.
 */
import type { TypeFilter as TypeFilterValue } from '../selectors'
import { FilterChips } from './FilterChips'
import { t } from '@/features/i18n/i18n'

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
      label={t('filter.type')}
      value={value}
      onChange={onChange}
      options={[
        { value: 'all', label: t('filter.allTypes') },
        { value: 'movie', label: t('filter.movies') },
        { value: 'tv', label: t('filter.series') },
      ]}
    />
  )
}
