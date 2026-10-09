/**
 * Catalogue « avec repli » utilisé uniquement en mode démo.
 *
 * Il essaie d'abord une source principale (TMDB via le proxy) et bascule
 * automatiquement sur une source de secours (le catalogue intégré) quand
 * TMDB n'est pas disponible.
 */
import { TmdbProxyError } from '@/lib/tmdb'
import type { CatalogSource } from './types'

/**
 * Crée un catalogue qui combine deux sources.
 *
 * Mode démo uniquement : utilise TMDB via le proxy quand il est disponible
 * (développement local avec un jeton TMDB) et bascule définitivement sur le
 * catalogue intégré dès que le proxy signale que TMDB n'est pas configuré
 * (ou qu'il n'existe aucune route /api).
 */
export function createFallbackCatalog(
  primary: CatalogSource,
  fallback: CatalogSource,
): CatalogSource {
  // Mémorise la bascule : une fois sur le catalogue de secours, on y reste
  // pour ne pas renvoyer inutilement des requêtes vouées à l'échec.
  let useFallback = false

  /** Exécute un appel sur la bonne source, avec repli si l'erreur le justifie. */
  async function run<T>(call: (source: CatalogSource) => Promise<T>): Promise<T> {
    if (useFallback) return call(fallback)
    try {
      return await call(primary)
    } catch (error) {
      // `network` : la route /api de l'application elle-même est injoignable (hébergement statique).
      if (
        error instanceof TmdbProxyError &&
        (error.kind === 'not_configured' || error.kind === 'network')
      ) {
        useFallback = true
        return call(fallback)
      }
      // Toute autre erreur (ex. titre introuvable) est une vraie erreur : on la propage.
      throw error
    }
  }

  return {
    search: (query, signal) => run((source) => source.search(query, signal)),
    trending: (signal) => run((source) => source.trending(signal)),
    getMovie: (tmdbId, signal) => run((source) => source.getMovie(tmdbId, signal)),
    getSeries: (tmdbId, signal) => run((source) => source.getSeries(tmdbId, signal)),
  }
}
