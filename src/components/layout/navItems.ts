import { Bookmark, House, Library, Search, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Hidden from the desktop nav (the search box lives in the header there). */
  mobileOnly?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Accueil', icon: House },
  { to: '/search', label: 'Rechercher', icon: Search, mobileOnly: true },
  { to: '/watchlist', label: 'À voir', icon: Bookmark },
  { to: '/library', label: 'Bibliothèque', icon: Library },
]
