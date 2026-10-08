import { z } from 'zod'
import type { MediaSummary, MovieDetails, SeasonSummary, SeriesDetails } from '@/types/media'

/**
 * TMDB responses are external, untrusted data. Every field is treated as
 * optional and normalized; a malformed search item is dropped instead of
 * failing the whole result list.
 */

const UNTITLED = 'Sans titre'
const IMAGE_PATH = /^\/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)$/i
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

const optionalText = z.string().nullish()
const tmdbId = z.number().int().positive()

function cleanText(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  return trimmed
}

function cleanImagePath(value: string | null | undefined): string | null {
  return value && IMAGE_PATH.test(value) ? value : null
}

function cleanDate(value: string | null | undefined): string | null {
  return value && ISO_DATE.test(value) ? value : null
}

const genresSchema = z
  .array(z.object({ name: optionalText }))
  .nullish()
  .transform((genres) => (genres ?? []).flatMap((g) => cleanText(g.name) ?? []))

const searchMovieSchema = z.object({
  media_type: z.literal('movie'),
  id: tmdbId,
  title: optionalText,
  original_title: optionalText,
  poster_path: optionalText,
  release_date: optionalText,
})

const searchTvSchema = z.object({
  media_type: z.literal('tv'),
  id: tmdbId,
  name: optionalText,
  original_name: optionalText,
  poster_path: optionalText,
  first_air_date: optionalText,
})

const searchItemSchema = z.discriminatedUnion('media_type', [searchMovieSchema, searchTvSchema])

const searchResponseSchema = z.object({ results: z.array(z.unknown()).catch([]) })

function summary(
  mediaType: MediaSummary['mediaType'],
  id: number,
  title: string | null | undefined,
  originalTitle: string | null | undefined,
  posterPath: string | null | undefined,
  date: string | null | undefined,
): MediaSummary {
  const cleanTitle = cleanText(title) ?? cleanText(originalTitle) ?? UNTITLED
  const cleanOriginal = cleanText(originalTitle)

  return {
    mediaType,
    tmdbId: id,
    title: cleanTitle,
    originalTitle: cleanOriginal && cleanOriginal !== cleanTitle ? cleanOriginal : null,
    posterPath: cleanImagePath(posterPath),
    releaseDate: cleanDate(date),
  }
}

/** Keeps movies and series, drops people and malformed items. */
export function parseSearchResponse(payload: unknown): MediaSummary[] {
  const { results } = searchResponseSchema.parse(payload)

  return results.flatMap((raw) => {
    const parsed = searchItemSchema.safeParse(raw)
    if (!parsed.success) return []

    const item = parsed.data
    return item.media_type === 'movie'
      ? summary(
          'movie',
          item.id,
          item.title,
          item.original_title,
          item.poster_path,
          item.release_date,
        )
      : summary('tv', item.id, item.name, item.original_name, item.poster_path, item.first_air_date)
  })
}

const movieDetailsSchema = z.object({
  id: tmdbId,
  title: optionalText,
  original_title: optionalText,
  overview: optionalText,
  poster_path: optionalText,
  backdrop_path: optionalText,
  release_date: optionalText,
  runtime: z.number().int().positive().nullish().catch(null),
  genres: genresSchema,
})

export function parseMovieDetails(payload: unknown): MovieDetails {
  const movie = movieDetailsSchema.parse(payload)

  return {
    ...summary(
      'movie',
      movie.id,
      movie.title,
      movie.original_title,
      movie.poster_path,
      movie.release_date,
    ),
    mediaType: 'movie',
    overview: cleanText(movie.overview),
    backdropPath: cleanImagePath(movie.backdrop_path),
    runtimeMinutes: movie.runtime ?? null,
    genres: movie.genres,
  }
}

const seasonSchema = z.object({
  season_number: z.number().int().min(0),
  name: optionalText,
  episode_count: z.number().int().min(0).nullish().catch(null),
  air_date: optionalText,
  poster_path: optionalText,
})

const seriesDetailsSchema = z.object({
  id: tmdbId,
  name: optionalText,
  original_name: optionalText,
  overview: optionalText,
  poster_path: optionalText,
  backdrop_path: optionalText,
  first_air_date: optionalText,
  in_production: z.boolean().nullish().catch(null),
  genres: genresSchema,
  seasons: z.array(z.unknown()).nullish().catch(null),
})

function parseSeasons(raw: unknown[] | null | undefined): SeasonSummary[] {
  return (raw ?? [])
    .flatMap((value) => {
      const parsed = seasonSchema.safeParse(value)
      if (!parsed.success) return []
      const season = parsed.data
      return {
        seasonNumber: season.season_number,
        name: cleanText(season.name) ?? `Saison ${String(season.season_number)}`,
        episodeCount: season.episode_count ?? null,
        airDate: cleanDate(season.air_date),
        posterPath: cleanImagePath(season.poster_path),
      }
    })
    .sort((a, b) => a.seasonNumber - b.seasonNumber)
}

export function parseSeriesDetails(payload: unknown): SeriesDetails {
  const series = seriesDetailsSchema.parse(payload)

  return {
    ...summary(
      'tv',
      series.id,
      series.name,
      series.original_name,
      series.poster_path,
      series.first_air_date,
    ),
    mediaType: 'tv',
    overview: cleanText(series.overview),
    backdropPath: cleanImagePath(series.backdrop_path),
    genres: series.genres,
    seasons: parseSeasons(series.seasons),
    inProduction: series.in_production ?? false,
  }
}
