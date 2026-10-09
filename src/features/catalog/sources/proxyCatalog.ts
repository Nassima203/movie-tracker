/**
 * Source de catalogue « réelle » : interroge TMDB via le proxy serveur `/api/tmdb`.
 *
 * Le navigateur ne parle jamais directement à TMDB (le jeton d'API reste côté
 * serveur). Chaque réponse brute est ensuite validée et nettoyée par les
 * fonctions de `tmdbSchemas.ts` avant d'être renvoyée à l'application.
 */
import { fetchFromTmdbProxy } from '@/lib/tmdb'
import { parseMovieDetails, parseSearchResponse, parseSeriesDetails } from '../tmdbSchemas'
import type { CatalogSource } from './types'

/** Implémentation de `CatalogSource` qui passe par le proxy TMDB du serveur. */
export const proxyCatalog: CatalogSource = {
  async search(query, signal) {
    const payload = await fetchFromTmdbProxy({ resource: 'search', query }, signalOption(signal))
    return parseSearchResponse(payload)
  },

  async trending(signal) {
    const payload = await fetchFromTmdbProxy({ resource: 'trending' }, signalOption(signal))
    // Les tendances ont le même format que des résultats de recherche.
    return parseSearchResponse(payload)
  },

  async getMovie(tmdbId, signal) {
    const payload = await fetchFromTmdbProxy(
      { resource: 'movie', id: tmdbId },
      signalOption(signal),
    )
    return parseMovieDetails(payload)
  },

  async getSeries(tmdbId, signal) {
    const payload = await fetchFromTmdbProxy({ resource: 'tv', id: tmdbId }, signalOption(signal))
    return parseSeriesDetails(payload)
  },
}

/**
 * Construit l'objet d'options `{ signal }` seulement si un signal existe.
 * Avec TypeScript strict (`exactOptionalPropertyTypes`), on ne peut pas passer
 * `signal: undefined` explicitement : on omet donc la propriété.
 */
function signalOption(signal: AbortSignal | undefined): { signal?: AbortSignal } {
  return signal ? { signal } : {}
}
