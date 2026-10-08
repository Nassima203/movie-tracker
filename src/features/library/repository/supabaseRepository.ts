import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { LibraryItem } from '@/types/media'
import type { LibraryRepository, UpsertLibraryItemInput } from './types'

type Client = SupabaseClient<Database>

const ITEM_COLUMNS =
  'media_type, tmdb_id, status, title, original_title, poster_path, release_date, season_count, added_at, watched_at, updated_at'

/** PostgREST caps responses (1000 rows by default): read in pages. */
const PAGE_SIZE = 1000

async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: Error | null }>,
): Promise<T[]> {
  const rows: T[] = []

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await fetchPage(from, from + PAGE_SIZE - 1)
    if (error) throw error
    const page = data ?? []
    rows.push(...page)
    if (page.length < PAGE_SIZE) return rows
  }
}

function toInsertRow(input: UpsertLibraryItemInput) {
  return {
    media_type: input.mediaType,
    tmdb_id: input.tmdbId,
    status: input.status,
    title: input.title,
    original_title: input.originalTitle,
    poster_path: input.posterPath,
    release_date: input.releaseDate,
    watched_at: input.status === 'watched' ? new Date().toISOString() : null,
    ...(input.seasonCount !== undefined ? { season_count: input.seasonCount } : {}),
  }
}

export function createSupabaseLibraryRepository(client: Client): LibraryRepository {
  return {
    async list() {
      const [items, seasons] = await Promise.all([
        fetchAllPages((from, to) =>
          client
            .from('library_items')
            .select(ITEM_COLUMNS)
            .order('updated_at', { ascending: false })
            .order('tmdb_id')
            .range(from, to),
        ),
        fetchAllPages((from, to) =>
          client
            .from('watched_seasons')
            .select('tmdb_id, season_number')
            .order('tmdb_id')
            .order('season_number')
            .range(from, to),
        ),
      ])

      const seasonsBySeries = new Map<number, number[]>()
      for (const season of seasons) {
        const list = seasonsBySeries.get(season.tmdb_id) ?? []
        list.push(season.season_number)
        seasonsBySeries.set(season.tmdb_id, list)
      }

      return items.map((row): LibraryItem => ({
        mediaType: row.media_type,
        tmdbId: row.tmdb_id,
        status: row.status,
        title: row.title,
        originalTitle: row.original_title,
        posterPath: row.poster_path,
        releaseDate: row.release_date,
        seasonCount: row.season_count,
        addedAt: row.added_at,
        watchedAt: row.watched_at,
        updatedAt: row.updated_at,
        watchedSeasons: row.media_type === 'tv' ? (seasonsBySeries.get(row.tmdb_id) ?? []) : [],
      }))
    },

    async upsert(input) {
      // The unique constraint (user_id, media_type, tmdb_id) makes this idempotent:
      // double clicks or concurrent tabs can never create duplicates.
      const { error } = await client
        .from('library_items')
        .upsert(toInsertRow(input), { onConflict: 'user_id,media_type,tmdb_id' })
      if (error) throw error
    },

    async remove(ref) {
      const { error } = await client
        .from('library_items')
        .delete()
        .eq('media_type', ref.mediaType)
        .eq('tmdb_id', ref.tmdbId)
      if (error) throw error
    },

    async setSeasonsWatched(seriesId, seasonNumbers, watched) {
      if (seasonNumbers.length === 0) return

      if (watched) {
        const { error } = await client.from('watched_seasons').upsert(
          seasonNumbers.map((season_number) => ({ tmdb_id: seriesId, season_number })),
          { onConflict: 'user_id,tmdb_id,season_number', ignoreDuplicates: true },
        )
        if (error) throw error
        return
      }

      const { error } = await client
        .from('watched_seasons')
        .delete()
        .eq('tmdb_id', seriesId)
        .in('season_number', seasonNumbers)
      if (error) throw error
    },
  }
}
