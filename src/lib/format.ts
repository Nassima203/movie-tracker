/**
 * Fonctions de mise en forme des données pour l'affichage (années, durées,
 * libellés, pluriels), dans la langue choisie.
 */
import { getLanguage, t } from '@/features/i18n/i18n'

/** Extrait l'année (« 2024 ») d'une date ISO « AAAA-MM-JJ », ou `null` si inconnue. */
export function formatYear(isoDate: string | null): string | null {
  return isoDate ? isoDate.slice(0, 4) : null
}

/**
 * Formate une durée en minutes : « 2 h 05 » au-delà d'une heure, sinon « 45 min ».
 * Renvoie `null` si la durée est inconnue ou nulle.
 */
export function formatRuntime(minutes: number | null): string | null {
  if (!minutes) return null
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return hours > 0 ? `${String(hours)} h ${String(rest).padStart(2, '0')}` : `${String(rest)} min`
}

/** Libellé du type de média : « Film » ou « Série » (« Movie » ou « Series »). */
export function mediaTypeLabel(mediaType: 'movie' | 'tv'): string {
  return mediaType === 'movie' ? t('media.movie') : t('media.series')
}

/**
 * Accorde un mot avec un nombre, ex. « 1 saison » / « 3 saisons ».
 * En français, 0 et 1 restent au singulier ; en anglais, seul 1 l'est.
 */
export function pluralize(count: number, singular: string, plural: string): string {
  const isPlural = getLanguage() === 'en' ? count !== 1 : count > 1
  return `${String(count)} ${isPlural ? plural : singular}`
}
