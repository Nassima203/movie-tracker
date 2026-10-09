/**
 * Types TypeScript de la base de données Supabase (voir supabase/migrations).
 * Ils décrivent les tables telles qu'elles sont stockées et typent le client Supabase.
 *
 * Écrits à la main pour correspondre à la migration. Une fois le projet Supabase lié,
 * on peut les régénérer avec : npx supabase gen types typescript --linked > src/types/database.ts
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type MediaTypeEnum = 'movie' | 'tv'
export type LibraryStatusEnum = 'watchlist' | 'watching' | 'watched'

export interface Database {
  public: {
    Tables: {
      library_items: {
        Row: {
          id: string
          user_id: string
          media_type: MediaTypeEnum
          tmdb_id: number
          status: LibraryStatusEnum
          title: string
          original_title: string | null
          poster_path: string | null
          release_date: string | null
          season_count: number | null
          added_at: string
          watched_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          media_type: MediaTypeEnum
          tmdb_id: number
          status?: LibraryStatusEnum
          title: string
          original_title?: string | null
          poster_path?: string | null
          release_date?: string | null
          season_count?: number | null
          added_at?: string
          watched_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          media_type?: MediaTypeEnum
          tmdb_id?: number
          status?: LibraryStatusEnum
          title?: string
          original_title?: string | null
          poster_path?: string | null
          release_date?: string | null
          season_count?: number | null
          added_at?: string
          watched_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      watched_seasons: {
        Row: {
          user_id: string
          media_type: MediaTypeEnum
          tmdb_id: number
          season_number: number
          watched_at: string
        }
        Insert: {
          user_id?: string
          media_type?: MediaTypeEnum
          tmdb_id: number
          season_number: number
          watched_at?: string
        }
        Update: {
          user_id?: string
          media_type?: MediaTypeEnum
          tmdb_id?: number
          season_number?: number
          watched_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'watched_seasons_series_fk'
            columns: ['user_id', 'media_type', 'tmdb_id']
            isOneToOne: false
            referencedRelation: 'library_items'
            referencedColumns: ['user_id', 'media_type', 'tmdb_id']
          },
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: {
      media_type: MediaTypeEnum
      library_status: LibraryStatusEnum
    }
    CompositeTypes: { [_ in never]: never }
  }
}
