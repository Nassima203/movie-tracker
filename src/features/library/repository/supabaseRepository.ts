/**
 * Implémentation Supabase du dépôt de la bibliothèque (mode normal, avec compte).
 *
 * Sécurité : on n'envoie jamais `user_id` depuis le navigateur. La base de
 * données le remplit elle-même (valeur par défaut `auth.uid()`, tirée de la
 * session de l'utilisateur connecté), et les
 * règles RLS (Row Level Security) de Postgres garantissent que chacun ne peut
 * lire et modifier que ses propres lignes. Même un client modifié ne pourrait
 * donc pas toucher à la bibliothèque d'un autre utilisateur.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { LibraryItem } from '@/types/media'
import type { LibraryRepository, UpsertLibraryItemInput } from './types'

type Client = SupabaseClient<Database>

// Colonnes lues dans `library_items` (`user_id` n'est pas nécessaire : RLS filtre déjà).
const ITEM_COLUMNS =
  'media_type, tmdb_id, status, title, original_title, poster_path, release_date, season_count, added_at, watched_at, updated_at'

/** PostgREST limite la taille des réponses (1000 lignes par défaut) : on lit page par page. */
const PAGE_SIZE = 1000

/**
 * Appelle `fetchPage` page après page jusqu'à recevoir une page incomplète,
 * signe qu'il n'y a plus de lignes, puis renvoie toutes les lignes réunies.
 */
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

/**
 * Convertit les données de l'application (camelCase) en ligne de la table
 * (snake_case). Pas de `user_id` ici : il vient de la session côté base.
 */
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
    // `season_count` n'est envoyé que s'il est fourni, pour ne pas écraser la valeur enregistrée.
    ...(input.seasonCount !== undefined ? { season_count: input.seasonCount } : {}),
  }
}

/** Crée le dépôt de la bibliothèque qui lit et écrit dans Supabase. */
export function createSupabaseLibraryRepository(client: Client): LibraryRepository {
  return {
    async list() {
      // Les titres et les saisons vues sont dans deux tables : on les lit en parallèle.
      // Tri stable (deux colonnes) pour que la pagination ne saute ni ne répète de ligne.
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

      // Regroupe les saisons vues par série (id TMDB → liste de numéros de saison).
      const seasonsBySeries = new Map<number, number[]>()
      for (const season of seasons) {
        const list = seasonsBySeries.get(season.tmdb_id) ?? []
        list.push(season.season_number)
        seasonsBySeries.set(season.tmdb_id, list)
      }

      // Conversion des lignes (snake_case) en objets de l'application (camelCase).
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
      // La contrainte d'unicité (user_id, media_type, tmdb_id) rend l'opération
      // idempotente : un double clic ou deux onglets simultanés ne peuvent
      // jamais créer de doublon.
      const { error } = await client
        .from('library_items')
        .upsert(toInsertRow(input), { onConflict: 'user_id,media_type,tmdb_id' })
      if (error) throw error
    },

    async remove(ref) {
      // Pas de filtre sur `user_id` : RLS limite déjà la suppression aux lignes
      // de l'utilisateur connecté. Les saisons vues sont supprimées automatiquement
      // par la base (clé étrangère `on delete cascade`).
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
        // `ignoreDuplicates` : cocher une saison déjà cochée ne fait rien (pas d'erreur).
        const { error } = await client.from('watched_seasons').upsert(
          seasonNumbers.map((season_number) => ({ tmdb_id: seriesId, season_number })),
          { onConflict: 'user_id,tmdb_id,season_number', ignoreDuplicates: true },
        )
        if (error) throw error
        return
      }

      // Décocher = supprimer les lignes correspondantes.
      const { error } = await client
        .from('watched_seasons')
        .delete()
        .eq('tmdb_id', seriesId)
        .in('season_number', seasonNumbers)
      if (error) throw error
    },
  }
}
