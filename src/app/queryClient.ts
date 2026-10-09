/**
 * Configuration de React Query, la bibliothèque qui gère le chargement, la mise
 * en cache et la réactualisation des données distantes (TMDB, Supabase).
 */
import { QueryClient } from '@tanstack/react-query'

/** Crée le client React Query avec les réglages par défaut de l'application. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Une seule nouvelle tentative en cas d'échec : assez pour un raté réseau
        // passager, sans faire patienter l'utilisateur trop longtemps.
        retry: 1,
        // Pas de rechargement automatique au retour sur l'onglet : les données
        // changent peu et cela évite des appels inutiles au proxy TMDB.
        refetchOnWindowFocus: false,
      },
      mutations: {
        // Jamais de nouvelle tentative automatique d'une écriture : cela pourrait
        // appliquer deux fois la même modification.
        retry: 0,
      },
    },
  })
}
