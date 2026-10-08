import { PageHeader } from '@/components/ui/PageHeader'
import { SearchCombobox } from '@/features/search/components/SearchCombobox'

export function SearchPage() {
  return (
    <>
      <PageHeader title="Rechercher" subtitle="Films et séries, dès la première lettre." />
      <SearchCombobox variant="inline" autoFocus maxResults={20} />
    </>
  )
}
