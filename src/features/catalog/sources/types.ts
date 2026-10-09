/**
 * Contrat commun à toutes les sources de catalogue.
 *
 * Le proxy TMDB, le catalogue de démo et le catalogue « avec repli »
 * implémentent tous cette interface : le reste de l'application peut donc
 * les utiliser sans savoir d'où viennent réellement les données.
 */
import type { MediaSummary, MovieDetails, SeriesDetails } from '@/types/media'

/**
 * Opérations qu'une source de catalogue doit fournir.
 * Chaque méthode accepte un `AbortSignal` optionnel pour pouvoir annuler
 * la requête en cours.
 */
export interface CatalogSource {
  /** Recherche des films et séries par titre. */
  search(query: string, signal?: AbortSignal): Promise<MediaSummary[]>
  /** Films et séries tendance cette semaine. */
  trending(signal?: AbortSignal): Promise<MediaSummary[]>
  /** Fiche détaillée d'un film. */
  getMovie(tmdbId: number, signal?: AbortSignal): Promise<MovieDetails>
  /** Fiche détaillée d'une série, saisons comprises. */
  getSeries(tmdbId: number, signal?: AbortSignal): Promise<SeriesDetails>
}
