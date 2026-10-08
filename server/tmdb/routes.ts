/**
 * Whitelist of TMDB resources the proxy may reach. Anything else is rejected:
 * the proxy is not an open relay to the TMDB API.
 */
export const TMDB_LANGUAGE = 'fr-FR'

const MAX_QUERY_LENGTH = 100
const MAX_PAGE = 500
const MAX_TMDB_ID = 2_147_483_647
const MAX_SEASON_NUMBER = 1000

/** Browser cache lifetime (seconds). Responses are per-user (`private`). */
const SEARCH_MAX_AGE = 300
const DETAILS_MAX_AGE = 3600

export interface UpstreamRequest {
  path: string
  params: Record<string, string>
  maxAge: number
}

export type RouteResult = { ok: true; upstream: UpstreamRequest } | { ok: false; message: string }

function parseIntegerInRange(value: string | null, min: number, max: number): number | null {
  if (value === null || !/^\d{1,10}$/.test(value)) return null
  const parsed = Number(value)
  return parsed >= min && parsed <= max ? parsed : null
}

function invalid(message: string): RouteResult {
  return { ok: false, message }
}

export function resolveTmdbRoute(searchParams: URLSearchParams): RouteResult {
  const resource = searchParams.get('resource')

  switch (resource) {
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
          params: { query, page: String(page), include_adult: 'false', language: TMDB_LANGUAGE },
          maxAge: SEARCH_MAX_AGE,
        },
      }
    }

    case 'trending':
      return {
        ok: true,
        upstream: {
          path: '/3/trending/all/week',
          params: { language: TMDB_LANGUAGE },
          maxAge: DETAILS_MAX_AGE,
        },
      }

    case 'movie':
    case 'tv': {
      const id = parseIntegerInRange(searchParams.get('id'), 1, MAX_TMDB_ID)
      if (id === null) return invalid('id must be a positive integer')

      return {
        ok: true,
        upstream: {
          path: `/3/${resource}/${String(id)}`,
          params: { language: TMDB_LANGUAGE },
          maxAge: DETAILS_MAX_AGE,
        },
      }
    }

    case 'season': {
      const id = parseIntegerInRange(searchParams.get('id'), 1, MAX_TMDB_ID)
      if (id === null) return invalid('id must be a positive integer')

      const season = parseIntegerInRange(searchParams.get('season'), 0, MAX_SEASON_NUMBER)
      if (season === null) return invalid('season must be a non-negative integer')

      return {
        ok: true,
        upstream: {
          path: `/3/tv/${String(id)}/season/${String(season)}`,
          params: { language: TMDB_LANGUAGE },
          maxAge: DETAILS_MAX_AGE,
        },
      }
    }

    default:
      return invalid('resource must be one of: search, trending, movie, tv, season')
  }
}
