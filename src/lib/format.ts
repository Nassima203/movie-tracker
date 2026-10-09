/**
 * Fonctions de mise en forme des données pour l'affichage (années, durées,
 * libellés, pluriels), en français.
 */

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

/** Libellé français du type de média : « Film » ou « Série ». */
export function mediaTypeLabel(mediaType: 'movie' | 'tv'): string {
  return mediaType === 'movie' ? 'Film' : 'Série'
}

/**
 * Accorde un mot avec un nombre, ex. « 1 saison » / « 3 saisons ».
 * En français, 0 et 1 restent au singulier (d'où le `count > 1`).
 */
export function pluralize(count: number, singular: string, plural: string): string {
  return `${String(count)} ${count > 1 ? plural : singular}`
}
