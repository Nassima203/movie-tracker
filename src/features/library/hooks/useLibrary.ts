import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { mediaKey, type LibraryItem, type MediaRef } from '@/types/media'
import { libraryRepository } from '../repository'

/** The user id is part of the key so cached data never leaks across accounts. */
export function libraryQueryKey(userId: string) {
  return ['library', userId] as const
}

export function useLibraryUserId(): string {
  const auth = useAuth()
  if (auth.status !== 'authenticated') {
    throw new Error('Library hooks require an authenticated user')
  }
  return auth.user.id
}

/** Whole library in one query: a personal library stays small enough. */
export function useLibrary() {
  const userId = useLibraryUserId()

  return useQuery({
    queryKey: libraryQueryKey(userId),
    queryFn: () => libraryRepository.list(),
    staleTime: 60 * 1000,
  })
}

export function indexLibrary(items: LibraryItem[] | undefined): Map<string, LibraryItem> {
  return new Map((items ?? []).map((item) => [mediaKey(item), item]))
}

export function useLibraryItem(ref: MediaRef): { item: LibraryItem | null; isLoading: boolean } {
  const query = useLibrary()
  const item =
    query.data?.find((entry) => entry.mediaType === ref.mediaType && entry.tmdbId === ref.tmdbId) ??
    null
  return { item, isLoading: query.isPending }
}
