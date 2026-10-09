/**
 * Types « métier » des films et séries, utilisés partout dans l'interface.
 * Ils sont indépendants du format brut de TMDB et de celui de la base de données :
 * les données externes sont converties vers ces types avant d'être affichées.
 */

/** Type de média : film (`movie`) ou série (`tv`, le nom utilisé par TMDB). */
export type MediaType = 'movie' | 'tv'

/** Identité métier d'un titre : les identifiants TMDB ne sont uniques que par type de média. */
export interface MediaRef {
  mediaType: MediaType
  tmdbId: number
}

/** Informations minimales d'un titre, suffisantes pour l'afficher dans une liste. */
export interface MediaSummary extends MediaRef {
  title: string
  originalTitle: string | null
  posterPath: string | null
  /** Date ISO (AAAA-MM-JJ) ou `null` si inconnue. */
  releaseDate: string | null
}

/** Fiche complète d'un film (page de détail). */
export interface MovieDetails extends MediaSummary {
  mediaType: 'movie'
  overview: string | null
  backdropPath: string | null
  runtimeMinutes: number | null
  genres: string[]
}

/** Résumé d'une saison de série. */
export interface SeasonSummary {
  seasonNumber: number
  name: string
  episodeCount: number | null
  airDate: string | null
  posterPath: string | null
}

/** Fiche complète d'une série (page de détail), avec la liste de ses saisons. */
export interface SeriesDetails extends MediaSummary {
  mediaType: 'tv'
  overview: string | null
  backdropPath: string | null
  genres: string[]
  seasons: SeasonSummary[]
  inProduction: boolean
}

/** Fiche détaillée d'un film ou d'une série ; `mediaType` permet de les distinguer. */
export type MediaDetails = MovieDetails | SeriesDetails

/** Statut d'un titre dans la bibliothèque : à voir, en cours ou vu. */
export type LibraryStatus = 'watchlist' | 'watching' | 'watched'

/** Titre enregistré dans la bibliothèque personnelle de l'utilisateur. */
export interface LibraryItem extends MediaSummary {
  status: LibraryStatus
  /** Séries uniquement : nombre de saisons régulières déjà diffusées (hors épisodes spéciaux). */
  seasonCount: number | null
  addedAt: string
  watchedAt: string | null
  updatedAt: string
  /** Séries uniquement : numéros des saisons vues, triés par ordre croissant. */
  watchedSeasons: number[]
}

/**
 * Clé texte unique d'un titre, ex. « movie:550 ». Pratique comme `key` React
 * ou comme clé de dictionnaire, puisque l'id TMDB seul ne suffit pas.
 */
export function mediaKey(ref: MediaRef): string {
  return `${ref.mediaType}:${String(ref.tmdbId)}`
}
