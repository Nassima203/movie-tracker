import type { LibraryItem, LibraryStatus, MediaRef, MediaSummary } from '@/types/media'

export interface UpsertLibraryItemInput extends MediaSummary {
  status: LibraryStatus
  /** Series only. Omitted means "keep the stored value". */
  seasonCount?: number | null
}

/**
 * Persistence boundary for the user's library. The Supabase implementation
 * never sends `user_id`: the database derives it from the session (RLS).
 */
export interface LibraryRepository {
  list(): Promise<LibraryItem[]>
  upsert(input: UpsertLibraryItemInput): Promise<void>
  remove(ref: MediaRef): Promise<void>
  setSeasonsWatched(seriesId: number, seasonNumbers: number[], watched: boolean): Promise<void>
}
