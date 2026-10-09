/**
 * Validation et normalisation des réponses TMDB avec la bibliothèque zod.
 *
 * Les réponses TMDB sont des données externes, non fiables. Chaque champ est
 * traité comme optionnel puis normalisé ; un élément de recherche mal formé
 * est ignoré au lieu de faire échouer toute la liste de résultats.
 *
 * Ce fichier convertit le format TMDB (snake_case, champs parfois absents ou
 * `null`) vers les types propres de l'application (`MediaSummary`,
 * `MovieDetails`, `SeriesDetails`).
 */
import { z } from 'zod'
import type { MediaSummary, MovieDetails, SeasonSummary, SeriesDetails } from '@/types/media'

/** Titre affiché quand TMDB ne fournit aucun titre exploitable. */
const UNTITLED = 'Sans titre'
// Chemin d'image TMDB attendu, ex. « /abc123.jpg ». Toute autre valeur est rejetée
// pour éviter d'injecter une URL arbitraire dans les balises <img>.
const IMAGE_PATH = /^\/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)$/i
// Date au format ISO « AAAA-MM-JJ ».
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

// Texte facultatif : TMDB peut renvoyer une chaîne, `null` ou rien du tout.
const optionalText = z.string().nullish()
// Un identifiant TMDB valide est un entier strictement positif.
const tmdbId = z.number().int().positive()

/** Retire les espaces autour du texte ; renvoie `null` si le texte est vide. */
function cleanText(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  return trimmed
}

/** Garde le chemin d'image seulement s'il a la forme attendue, sinon `null`. */
function cleanImagePath(value: string | null | undefined): string | null {
  return value && IMAGE_PATH.test(value) ? value : null
}

/** Garde la date seulement si elle est au format ISO, sinon `null`. */
function cleanDate(value: string | null | undefined): string | null {
  return value && ISO_DATE.test(value) ? value : null
}

// Liste de genres : on ne garde que les noms non vides. `.transform` convertit
// directement le tableau d'objets TMDB en simple tableau de chaînes.
const genresSchema = z
  .array(z.object({ name: optionalText }))
  .nullish()
  .transform((genres) => (genres ?? []).flatMap((g) => cleanText(g.name) ?? []))

// Forme minimale d'un film dans les résultats de recherche TMDB.
const searchMovieSchema = z.object({
  media_type: z.literal('movie'),
  id: tmdbId,
  title: optionalText,
  original_title: optionalText,
  poster_path: optionalText,
  release_date: optionalText,
})

// Forme minimale d'une série dans les résultats de recherche TMDB.
const searchTvSchema = z.object({
  media_type: z.literal('tv'),
  id: tmdbId,
  name: optionalText,
  original_name: optionalText,
  poster_path: optionalText,
  first_air_date: optionalText,
})

// Union « discriminée » : zod lit `media_type` pour choisir le bon schéma.
// Les personnes (`media_type: 'person'`) ne correspondent à aucun schéma et seront écartées.
const searchItemSchema = z.discriminatedUnion('media_type', [searchMovieSchema, searchTvSchema])

// On valide d'abord seulement l'enveloppe ; chaque élément est vérifié un par un ensuite.
// `.catch([])` : si `results` est absent ou invalide, on obtient une liste vide au lieu d'une erreur.
const searchResponseSchema = z.object({ results: z.array(z.unknown()).catch([]) })

/**
 * Construit un `MediaSummary` propre à partir des champs bruts TMDB
 * (commun aux films et aux séries).
 */
function summary(
  mediaType: MediaSummary['mediaType'],
  id: number,
  title: string | null | undefined,
  originalTitle: string | null | undefined,
  posterPath: string | null | undefined,
  date: string | null | undefined,
): MediaSummary {
  // Repli : titre localisé, sinon titre original, sinon « Sans titre ».
  const cleanTitle = cleanText(title) ?? cleanText(originalTitle) ?? UNTITLED
  const cleanOriginal = cleanText(originalTitle)

  return {
    mediaType,
    tmdbId: id,
    title: cleanTitle,
    // Inutile d'afficher le titre original s'il est identique au titre principal.
    originalTitle: cleanOriginal && cleanOriginal !== cleanTitle ? cleanOriginal : null,
    posterPath: cleanImagePath(posterPath),
    releaseDate: cleanDate(date),
  }
}

/**
 * Convertit une réponse de recherche (ou de tendances) TMDB en liste de résumés.
 * Garde les films et les séries, écarte les personnes et les éléments mal formés.
 */
export function parseSearchResponse(payload: unknown): MediaSummary[] {
  const { results } = searchResponseSchema.parse(payload)

  return results.flatMap((raw) => {
    // `safeParse` ne lève pas d'exception : un élément invalide est simplement ignoré
    // (renvoyer `[]` dans `flatMap` revient à le retirer de la liste).
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

// Fiche détaillée d'un film. `.catch(null)` remplace une durée invalide par `null`
// au lieu de rejeter toute la fiche.
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

/**
 * Valide et normalise la fiche détaillée d'un film TMDB.
 * Lève une erreur zod si l'essentiel (l'identifiant) est invalide.
 */
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

// Une saison de série ; la saison 0 correspond aux épisodes spéciaux chez TMDB.
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
  // Les saisons sont validées une à une par `parseSeasons` pour ignorer les mauvaises.
  seasons: z.array(z.unknown()).nullish().catch(null),
})

/** Valide chaque saison, écarte celles qui sont invalides et trie par numéro. */
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

/**
 * Valide et normalise la fiche détaillée d'une série TMDB, saisons comprises.
 * Lève une erreur zod si l'essentiel (l'identifiant) est invalide.
 */
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
