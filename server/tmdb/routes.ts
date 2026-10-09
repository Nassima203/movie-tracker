/**
 * Liste blanche des requêtes TMDB autorisées.
 *
 * Le proxy ne relaie QUE ces 5 types de requête, avec des paramètres vérifiés.
 * Tout le reste est refusé : on ne veut pas d'un relais ouvert vers toute l'API
 * TMDB (ce qui permettrait à quelqu'un d'utiliser notre token pour autre chose).
 */
const TMDB_LANGUAGE = 'fr-FR'

// Limites de validation des paramètres reçus du navigateur.
const MAX_QUERY_LENGTH = 100
const MAX_PAGE = 500
const MAX_TMDB_ID = 2_147_483_647 // plus grand entier PostgreSQL « integer »
const MAX_SEASON_NUMBER = 1000

// Durée (en secondes) pendant laquelle le navigateur peut garder la réponse en cache.
const SEARCH_MAX_AGE = 5 * 60
const DETAILS_MAX_AGE = 60 * 60

/** Requête à envoyer à TMDB une fois la demande validée. */
interface UpstreamRequest {
  path: string
  params: Record<string, string>
  maxAge: number
}

type RouteResult = { ok: true; upstream: UpstreamRequest } | { ok: false; message: string }

/** Lit un entier strictement composé de chiffres et compris entre min et max ; sinon null. */
function parseIntegerInRange(value: string | null, min: number, max: number): number | null {
  if (value === null || !/^\d{1,10}$/.test(value)) return null
  const parsed = Number(value)
  return parsed >= min && parsed <= max ? parsed : null
}

function invalid(message: string): RouteResult {
  return { ok: false, message }
}

/** Fiche détaillée (film, série, saison) : même langue et même durée de cache. */
function details(path: string): RouteResult {
  return {
    ok: true,
    upstream: { path, params: { language: TMDB_LANGUAGE }, maxAge: DETAILS_MAX_AGE },
  }
}

/** Transforme les paramètres de l'URL (`?resource=…`) en requête TMDB, ou en erreur. */
export function resolveTmdbRoute(searchParams: URLSearchParams): RouteResult {
  const resource = searchParams.get('resource')

  switch (resource) {
    // Recherche films + séries (TMDB renvoie aussi des personnes, filtrées côté navigateur).
    case 'search': {
      const query = searchParams.get('query')?.trim() ?? ''
      if (query.length === 0 || query.length > MAX_QUERY_LENGTH) {
        return invalid(`query must contain 1 to ${String(MAX_QUERY_LENGTH)} characters`)
      }

      const rawPage = searchParams.get('page')
      const page = rawPage === null ? 1 : parseIntegerInRange(rawPage, 1, MAX_PAGE)
      if (page === null) return invalid(`page must be an integer between 1 and ${String(MAX_PAGE)}`)

      return {
        ok: true,
        upstream: {
          path: '/3/search/multi',
          // `include_adult` est imposé ici : le navigateur ne peut pas le changer.
          params: { query, page: String(page), include_adult: 'false', language: TMDB_LANGUAGE },
          maxAge: SEARCH_MAX_AGE,
        },
      }
    }

    // Films et séries tendance de la semaine (page d'accueil).
    case 'trending':
      return details('/3/trending/all/week')

    // Fiche d'un film ou d'une série.
    case 'movie':
    case 'tv': {
      const id = parseIntegerInRange(searchParams.get('id'), 1, MAX_TMDB_ID)
      if (id === null) return invalid('id must be a positive integer')
      return details(`/3/${resource}/${String(id)}`)
    }

    // Détail d'une saison (la saison 0 = épisodes spéciaux, d'où le minimum à 0).
    case 'season': {
      const id = parseIntegerInRange(searchParams.get('id'), 1, MAX_TMDB_ID)
      if (id === null) return invalid('id must be a positive integer')

      const season = parseIntegerInRange(searchParams.get('season'), 0, MAX_SEASON_NUMBER)
      if (season === null) return invalid('season must be a non-negative integer')

      return details(`/3/tv/${String(id)}/season/${String(season)}`)
    }

    default:
      return invalid('resource must be one of: search, trending, movie, tv, season')
  }
}
