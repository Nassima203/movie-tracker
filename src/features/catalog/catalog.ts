/**
 * Point d'entrée du catalogue (films et séries).
 *
 * Ce fichier choisit QUELLE source de données le reste de l'application utilise :
 * TMDB via le proxy serveur, ou le catalogue de démonstration intégré.
 * Il définit aussi les clés de cache TanStack Query et les durées de fraîcheur
 * partagées par les hooks qui interrogent le catalogue.
 */
import { isDemoMode } from '@/lib/env'
import { demoCatalog } from './sources/demoCatalog'
import { createFallbackCatalog } from './sources/fallbackCatalog'
import { proxyCatalog } from './sources/proxyCatalog'
import type { CatalogSource } from './sources/types'

/**
 * Source de catalogue unique utilisée par toute l'application.
 *
 * Mode réel : TMDB uniquement. Mode démo (sans Supabase) : TMDB si le proxy
 * local possède un jeton, sinon le catalogue intégré.
 */
export const catalog: CatalogSource = isDemoMode
  ? createFallbackCatalog(proxyCatalog, demoCatalog)
  : proxyCatalog

/**
 * Fabrique des clés de cache TanStack Query pour le catalogue.
 * Centraliser les clés évite les fautes de frappe et permet d'invalider
 * ou de relire le cache de manière cohérente depuis plusieurs fichiers.
 */
export const catalogKeys = {
  search: (query: string) => ['catalog', 'search', query] as const,
  trending: ['catalog', 'trending'] as const,
  movie: (tmdbId: number) => ['catalog', 'movie', tmdbId] as const,
  series: (tmdbId: number) => ['catalog', 'tv', tmdbId] as const,
}

/**
 * Durée (en ms) pendant laquelle les fiches détaillées restent « fraîches ».
 * Les métadonnées TMDB changent rarement : on les garde une heure sans
 * refaire de requête réseau.
 */
export const DETAILS_STALE_TIME = 60 * 60 * 1000

/**
 * Durée (en ms) de fraîcheur des résultats de recherche : 5 minutes.
 * Retaper la même recherche dans ce délai réutilise le cache.
 */
export const SEARCH_STALE_TIME = 5 * 60 * 1000
