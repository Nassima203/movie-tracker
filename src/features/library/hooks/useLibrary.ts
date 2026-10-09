/**
 * Hooks de lecture de la bibliothèque de l'utilisateur.
 *
 * La bibliothèque est chargée via TanStack Query (cache, rechargement
 * automatique) depuis le dépôt actif : Supabase, ou localStorage en mode démo.
 */
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { mediaKey, type LibraryItem, type MediaRef } from '@/types/media'
import { libraryRepository } from '../repository'

/**
 * Clé de cache de la bibliothèque. L'identifiant utilisateur en fait partie
 * pour que les données en cache ne fuient jamais d'un compte à l'autre.
 */
export function libraryQueryKey(userId: string) {
  return ['library', userId] as const
}

/**
 * Renvoie l'identifiant de l'utilisateur connecté. Lève une erreur si personne
 * n'est connecté : ces hooks ne doivent être utilisés que sur des pages protégées.
 */
export function useLibraryUserId(): string {
  const auth = useAuth()
  if (auth.status !== 'authenticated') {
    throw new Error('Library hooks require an authenticated user')
  }
  return auth.user.id
}

/** Toute la bibliothèque en une seule requête : une bibliothèque personnelle reste assez petite. */
export function useLibrary() {
  const userId = useLibraryUserId()

  return useQuery({
    queryKey: libraryQueryKey(userId),
    queryFn: () => libraryRepository.list(),
    // Les données sont considérées « fraîches » pendant 1 minute (pas de rechargement inutile).
    staleTime: 60 * 1000,
  })
}

/**
 * Transforme la liste en dictionnaire (`Map`) indexé par clé de média, pour
 * retrouver rapidement l'entrée d'un titre (ex. : afficher son statut sur une affiche).
 */
export function indexLibrary(items: LibraryItem[] | undefined): Map<string, LibraryItem> {
  return new Map((items ?? []).map((item) => [mediaKey(item), item]))
}

/** L'entrée de la bibliothèque pour un titre donné, ou null s'il n'y est pas. */
export function useLibraryItem(ref: MediaRef): LibraryItem | null {
  const { data } = useLibrary()
  return (
    data?.find((entry) => entry.mediaType === ref.mediaType && entry.tmdbId === ref.tmdbId) ?? null
  )
}
