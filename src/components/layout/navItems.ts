/**
 * Liste des liens de navigation principale, partagée par la barre du haut
 * (ordinateur) et la barre du bas (mobile) de `AppLayout`.
 */
import { Bookmark, House, Library, Play, Search, type LucideIcon } from 'lucide-react'
import type { TranslationKey } from '@/features/i18n/translations'

/** Un lien de navigation : destination, libellé et icône. */
interface NavItem {
  to: string
  labelKey: TranslationKey
  icon: LucideIcon
  /** Masqué dans la navigation ordinateur (le champ de recherche est alors dans l'en-tête). */
  mobileOnly?: boolean
}

/** Les pages principales de l'application, dans l'ordre d'affichage. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/', labelKey: 'nav.home', icon: House },
  { to: '/search', labelKey: 'nav.search', icon: Search, mobileOnly: true },
  { to: '/watchlist', labelKey: 'nav.watchlist', icon: Bookmark },
  { to: '/in-progress', labelKey: 'nav.inProgress', icon: Play },
  { to: '/library', labelKey: 'nav.library', icon: Library },
]
