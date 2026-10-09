/**
 * Hook de recherche de films et séries pendant la frappe.
 *
 * Il attend que l'utilisateur fasse une courte pause (debounce) avant
 * d'interroger le catalogue, puis résume l'avancement de la requête en un
 * statut simple (`idle`, `loading`, `success`, `empty`, `error`) que
 * l'interface peut afficher directement.
 */
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { catalog, catalogKeys, SEARCH_STALE_TIME } from '@/features/catalog/catalog'
import { useDebounce } from '@/hooks/useDebounce'
import { TmdbProxyError } from '@/lib/tmdb'
import type { MediaSummary } from '@/types/media'

/**
 * Délai d'attente (en ms) après la dernière frappe avant de lancer la recherche.
 * Évite d'envoyer une requête à chaque lettre tapée.
 */
const SEARCH_DEBOUNCE_MS = 300
/** Spécification produit : la recherche démarre dès le premier caractère. */
const MIN_QUERY_LENGTH = 1

/**
 * État de la recherche tel qu'affiché à l'écran :
 * - `idle` : rien n'est saisi ;
 * - `loading` : recherche en cours, aucun résultat à montrer pour l'instant ;
 * - `success` : des résultats sont disponibles ;
 * - `empty` : la recherche a abouti mais n'a rien trouvé ;
 * - `error` : la recherche a échoué.
 */
type SearchStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error'

/** Tout ce que le hook renvoie au composant de recherche. */
export interface TmdbSearchState {
  /** La requête réellement envoyée (après debounce et sans espaces autour). */
  query: string
  status: SearchStatus
  results: MediaSummary[]
  /** Vrai pendant qu'une requête plus récente est en cours (les résultats précédents restent affichés). */
  isRefreshing: boolean
  /** L'erreur de la dernière requête, s'il y en a une. */
  error: unknown
  /** Relance la recherche (bouton « Réessayer »). */
  retry: () => void
}

/**
 * Décide si TanStack Query doit retenter une requête échouée.
 * Les erreurs « définitives » (requête invalide, accès refusé, introuvable)
 * ne sont pas retentées : réessayer donnerait le même résultat. Les autres
 * (réseau, serveur) sont retentées une seule fois.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (
    error instanceof TmdbProxyError &&
    ['invalid_request', 'unauthorized', 'not_found'].includes(error.kind)
  ) {
    return false
  }
  return failureCount < 1
}

/**
 * Recherche TMDB avec debounce. TanStack Query fournit le cache (une requête
 * identique n'est pas renvoyée) et annule la requête d'une recherche périmée
 * via l'AbortSignal quand la clé de requête change ou que le composant est démonté.
 */
export function useTmdbSearch(rawQuery: string): TmdbSearchState {
  const trimmed = rawQuery.trim()
  // `query` ne prend la valeur de `trimmed` qu'après 300 ms sans nouvelle frappe.
  const query = useDebounce(trimmed, SEARCH_DEBOUNCE_MS)
  const enabled = query.length >= MIN_QUERY_LENGTH

  const result = useQuery({
    // Clé en minuscules : « Dune » et « dune » partagent la même entrée de cache.
    queryKey: catalogKeys.search(query.toLowerCase()),
    queryFn: ({ signal }) => catalog.search(query, signal),
    enabled,
    staleTime: SEARCH_STALE_TIME,
    // Garde les anciens résultats affichés pendant le chargement des nouveaux
    // (évite que la liste clignote à chaque frappe).
    placeholderData: keepPreviousData,
    retry: shouldRetry,
  })

  // Vrai si l'utilisateur a tapé quelque chose qui n'a pas encore été envoyé.
  const isDebouncing = trimmed !== query
  const results = enabled ? (result.data ?? []) : []

  // Calcul du statut affiché. L'ordre des tests compte : le premier qui correspond l'emporte.
  let status: SearchStatus
  if (trimmed.length < MIN_QUERY_LENGTH) status = 'idle'
  // On n'affiche l'erreur que si aucune nouvelle requête n'est en attente ou en cours.
  else if (result.isError && !isDebouncing && !result.isFetching) status = 'error'
  // Aucune donnée encore reçue : chargement.
  else if (!result.data || (isDebouncing && !enabled)) status = 'loading'
  // Données provisoires (anciens résultats) ou frappe en attente : on ne conclut
  // pas encore « aucun résultat », on garde la liste ou on reste en chargement.
  else if (result.isPlaceholderData || isDebouncing)
    status = results.length > 0 ? 'success' : 'loading'
  else status = results.length > 0 ? 'success' : 'empty'

  return {
    query,
    status,
    results,
    isRefreshing: status === 'success' && (isDebouncing || result.isFetching),
    error: result.error,
    retry: () => {
      void result.refetch()
    },
  }
}
