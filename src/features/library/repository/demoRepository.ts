import { z } from 'zod'
import type { LibraryItem } from '@/types/media'
import type { LibraryRepository } from './types'

const STORAGE_KEY = 'uwatch:demo-library'

const itemSchema = z.object({
  mediaType: z.enum(['movie', 'tv']),
  tmdbId: z.number().int().positive(),
  status: z.enum(['watchlist', 'watched']),
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

function wait(ms = 200): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Demo mode only: the library lives in this browser's localStorage. It mirrors
 * the database rules (one entry per media, seasons only for series).
 */
export function createDemoLibraryRepository(latencyMs = 200): LibraryRepository {
  let memory: LibraryItem[] = []

  function read(): LibraryItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return memory
      const parsed = storeSchema.safeParse(JSON.parse(raw))
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
      // Storage unavailable: keep the in-memory copy for this session.
    }
  }

  function sameMedia(item: LibraryItem, mediaType: string, tmdbId: number): boolean {
    return item.mediaType === mediaType && item.tmdbId === tmdbId
  }

  return {
    async list() {
      await wait(latencyMs)
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
        seasonCount:
          input.mediaType === 'tv' ? (input.seasonCount ?? existing?.seasonCount ?? null) : null,
        addedAt: existing?.addedAt ?? now,
        watchedAt: input.status === 'watched' ? now : null,
        updatedAt: now,
        watchedSeasons: existing?.watchedSeasons ?? [],
      }
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
