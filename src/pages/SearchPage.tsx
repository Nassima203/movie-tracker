/**
 * Page de recherche (/search).
 *
 * Affiche le champ de recherche de films et séries (via TMDB) avec les
 * résultats directement dans la page.
 */
import { PageHeader } from '@/components/ui/PageHeader'
import { SearchCombobox } from '@/features/search/components/SearchCombobox'
import { t } from '@/features/i18n/i18n'

/** Recherche en ligne avec focus automatique et jusqu'à 20 résultats. */
export function SearchPage() {
  return (
    <>
      <PageHeader title={t('search.pageTitle')} subtitle={t('search.pageSubtitle')} />
      <SearchCombobox variant="inline" autoFocus maxResults={20} />
    </>
  )
}
