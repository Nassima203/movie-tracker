/**
 * Contrat (interface TypeScript) du « dépôt » de la bibliothèque : la couche
 * qui lit et écrit les données. Deux implémentations le respectent :
 * Supabase (production) et localStorage (mode démo). Le reste de l'application
 * ne dépend que de ce contrat, pas de la technologie de stockage.
 */
import type { LibraryItem, LibraryStatus, MediaRef, MediaSummary } from '@/types/media'

/** Données nécessaires pour ajouter ou mettre à jour un titre. */
export interface UpsertLibraryItemInput extends MediaSummary {
  status: LibraryStatus
  /** Séries uniquement. Absent signifie « garder la valeur enregistrée ». */
  seasonCount?: number | null
}

/**
 * Frontière de persistance de la bibliothèque de l'utilisateur.
 * L'implémentation Supabase n'envoie jamais `user_id` : la base le déduit de
 * la session (RLS).
 */
export interface LibraryRepository {
  /** Toute la bibliothèque, avec les saisons vues de chaque série. */
  list(): Promise<LibraryItem[]>
  /** Ajoute le titre, ou le met à jour s'il existe déjà. */
  upsert(input: UpsertLibraryItemInput): Promise<void>
  /** Retire le titre (et ses saisons vues). */
  remove(ref: MediaRef): Promise<void>
  /** Coche (`watched = true`) ou décoche des saisons d'une série déjà présente. */
  setSeasonsWatched(seriesId: number, seasonNumbers: number[], watched: boolean): Promise<void>
}
