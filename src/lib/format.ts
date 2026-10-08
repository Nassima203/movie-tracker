export function formatYear(isoDate: string | null): string | null {
  return isoDate ? isoDate.slice(0, 4) : null
}

export function formatRuntime(minutes: number | null): string | null {
  if (!minutes) return null
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return hours > 0 ? `${String(hours)} h ${String(rest).padStart(2, '0')}` : `${String(rest)} min`
}

export function mediaTypeLabel(mediaType: 'movie' | 'tv'): string {
  return mediaType === 'movie' ? 'Film' : 'Série'
}

export function pluralize(count: number, singular: string, plural: string): string {
  return `${String(count)} ${count > 1 ? plural : singular}`
}
