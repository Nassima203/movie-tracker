/**
 * Liste des liens de navigation principale, partagée par la barre du haut
 * (ordinateur) et la barre du bas (mobile) de `AppLayout`.
 */
import { Bookmark, House, Library, Play, Search, type LucideIcon } from 'lucide-react'

/** Un lien de navigation : destination, libellé et icône. */
interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Masqué dans la navigation ordinateur (le champ de recherche est alors dans l'en-tête). */
  mobileOnly?: boolean
}

/** Les pages principales de l'application, dans l'ordre d'affichage. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Accueil', icon: House },
  { to: '/search', label: 'Rechercher', icon: Search, mobileOnly: true },
  { to: '/watchlist', label: 'À voir', icon: Bookmark },
  { to: '/in-progress', label: 'En cours', icon: Play },
  { to: '/library', label: 'Bibliothèque', icon: Library },
]
