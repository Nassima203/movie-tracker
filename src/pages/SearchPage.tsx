/**
 * Page de recherche (/search).
 *
 * Affiche le champ de recherche de films et séries (via TMDB) avec les
 * résultats directement dans la page.
 */
import { PageHeader } from '@/components/ui/PageHeader'
import { SearchCombobox } from '@/features/search/components/SearchCombobox'

/** Recherche en ligne avec focus automatique et jusqu'à 20 résultats. */
export function SearchPage() {
  return (
    <>
      <PageHeader title="Rechercher" subtitle="Films et séries, dès la première lettre." />
      <SearchCombobox variant="inline" autoFocus maxResults={20} />
    </>
  )
}
