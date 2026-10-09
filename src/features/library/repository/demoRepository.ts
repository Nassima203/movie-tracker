/**
 * Implémentation « démo » du dépôt de la bibliothèque : les données sont
 * stockées dans le localStorage du navigateur, sans compte ni serveur.
 * Utilisée quand Supabase n'est pas configuré (voir `index.ts`).
 */
import { z } from 'zod'
import type { LibraryItem } from '@/types/media'
import type { LibraryRepository } from './types'

const STORAGE_KEY = 'uwatch:demo-library'

// Schéma de validation (zod) : le localStorage peut contenir des données
// anciennes ou modifiées à la main, on vérifie donc leur forme avant de s'en servir.
const itemSchema = z.object({
  mediaType: z.enum(['movie', 'tv']),
  tmdbId: z.number().int().positive(),
  status: z.enum(['watchlist', 'watching', 'watched']),
  title: z.string().min(1),
  originalTitle: z.string().nullable(),
  posterPath: z.string().nullable(),
  releaseDate: z.string().nullable(),
  seasonCount: z.number().int().min(0).nullable(),
  addedAt: z.string(),
  watchedAt: z.string().nullable(),
  updatedAt: z.string(),
  watchedSeasons: z.array(z.number().int().min(0)),
})

const storeSchema = z.array(itemSchema)

/** Petite pause pour simuler la latence réseau (et voir les états de chargement). */
function wait(ms = 200): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Mode démo uniquement : la bibliothèque vit dans le localStorage de ce
 * navigateur. Elle reproduit les règles de la base de données (une seule
 * entrée par média, saisons uniquement pour les séries).
 */
export function createDemoLibraryRepository(latencyMs = 200): LibraryRepository {
  // Copie en mémoire, utilisée si le localStorage est indisponible
  // (navigation privée, stockage plein ou bloqué…).
  let memory: LibraryItem[] = []

  function read(): LibraryItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return memory
      const parsed = storeSchema.safeParse(JSON.parse(raw))
      // Données invalides : on repart d'une bibliothèque vide plutôt que de planter.
      return parsed.success ? parsed.data : []
    } catch {
      return memory
    }
  }

  function write(items: LibraryItem[]): void {
    memory = items
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Stockage indisponible : on garde la copie en mémoire pour cette session.
    }
  }

  function sameMedia(item: LibraryItem, mediaType: string, tmdbId: number): boolean {
    return item.mediaType === mediaType && item.tmdbId === tmdbId
  }

  return {
    async list() {
      await wait(latencyMs)
      // Les plus récemment modifiés d'abord, comme la version Supabase.
      return [...read()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    },

    async upsert(input) {
      await wait(latencyMs)
      const items = read()
      const now = new Date().toISOString()
      const existing = items.find((item) => sameMedia(item, input.mediaType, input.tmdbId))
      const next: LibraryItem = {
        mediaType: input.mediaType,
        tmdbId: input.tmdbId,
        status: input.status,
        title: input.title,
        originalTitle: input.originalTitle,
        posterPath: input.posterPath,
        releaseDate: input.releaseDate,
        // Nombre de saisons : séries uniquement ; s'il n'est pas fourni, on garde l'ancien.
        seasonCount:
          input.mediaType === 'tv' ? (input.seasonCount ?? existing?.seasonCount ?? null) : null,
        // La date d'ajout d'origine est conservée lors d'une mise à jour.
        addedAt: existing?.addedAt ?? now,
        watchedAt: input.status === 'watched' ? now : null,
        updatedAt: now,
        watchedSeasons: existing?.watchedSeasons ?? [],
      }
      // On remplace l'éventuelle entrée existante : jamais de doublon.
      write([next, ...items.filter((item) => item !== existing)])
    },

    async remove(ref) {
      await wait(latencyMs)
      write(read().filter((item) => !sameMedia(item, ref.mediaType, ref.tmdbId)))
    },

    async setSeasonsWatched(seriesId, seasonNumbers, watched) {
      await wait(latencyMs)
      const items = read()
      const series = items.find((item) => sameMedia(item, 'tv', seriesId))
      // Même règle que la clé étrangère en base : la série doit déjà être dans la bibliothèque.
      if (!series) throw new Error('Series must be in the library before tracking seasons')

      const seasons = new Set(series.watchedSeasons)
      for (const season of seasonNumbers) {
        if (watched) seasons.add(season)
        else seasons.delete(season)
      }
      const updated: LibraryItem = {
        ...series,
        watchedSeasons: [...seasons].sort((a, b) => a - b),
        updatedAt: new Date().toISOString(),
      }
      write(items.map((item) => (item === series ? updated : item)))
    },
  }
}
