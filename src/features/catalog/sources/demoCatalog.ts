import type { MediaSummary, MovieDetails, SeasonSummary, SeriesDetails } from '@/types/media'
import type { CatalogSource } from './types'

/**
 * Demo mode only: a small built-in catalog so the interface can be explored
 * without Supabase or a TMDB token. Posters are intentionally absent (the UI
 * falls back to a designed placeholder). Real data comes from TMDB.
 */

interface DemoSeries {
  id: number
  title: string
  originalTitle?: string
  firstAirDate: string
  overview: string
  genres: string[]
  seasons: { episodes: number; airDate: string | null }[]
  inProduction?: boolean
}

interface DemoMovie {
  id: number
  title: string
  originalTitle?: string
  releaseDate: string
  overview: string
  genres: string[]
  runtime: number
}

const movies: DemoMovie[] = [
  {
    id: 27205,
    title: 'Inception',
    releaseDate: '2010-07-15',
    runtime: 148,
    genres: ['Action', 'Science-Fiction'],
    overview:
      'Un voleur capable de s’introduire dans les rêves se voit confier une mission impossible : implanter une idée.',
  },
  {
    id: 157336,
    title: 'Interstellar',
    releaseDate: '2014-11-05',
    runtime: 169,
    genres: ['Aventure', 'Drame', 'Science-Fiction'],
    overview:
      'Des explorateurs traversent un trou de ver pour trouver un nouveau foyer à l’humanité.',
  },
  {
    id: 155,
    title: 'The Dark Knight : Le Chevalier noir',
    originalTitle: 'The Dark Knight',
    releaseDate: '2008-07-16',
    runtime: 152,
    genres: ['Action', 'Crime', 'Drame'],
    overview: 'Batman affronte le Joker, un criminel décidé à plonger Gotham dans le chaos.',
  },
  {
    id: 550,
    title: 'Fight Club',
    releaseDate: '1999-10-15',
    runtime: 139,
    genres: ['Drame'],
    overview: 'Un employé insomniaque et un vendeur de savon fondent un club de combat clandestin.',
  },
  {
    id: 680,
    title: 'Pulp Fiction',
    releaseDate: '1994-09-10',
    runtime: 154,
    genres: ['Thriller', 'Crime'],
    overview:
      'Les destins de gangsters, d’un boxeur et d’un couple de braqueurs s’entremêlent à Los Angeles.',
  },
  {
    id: 496243,
    title: 'Parasite',
    originalTitle: '기생충',
    releaseDate: '2019-05-30',
    runtime: 133,
    genres: ['Comédie', 'Thriller', 'Drame'],
    overview: 'Une famille pauvre s’infiltre peu à peu dans le quotidien d’une famille aisée.',
  },
  {
    id: 438631,
    title: 'Dune',
    releaseDate: '2021-09-15',
    runtime: 155,
    genres: ['Science-Fiction', 'Aventure'],
    overview: 'Paul Atréides se rend sur Arrakis, la planète la plus dangereuse de l’univers.',
  },
  {
    id: 603,
    title: 'Matrix',
    originalTitle: 'The Matrix',
    releaseDate: '1999-03-30',
    runtime: 136,
    genres: ['Action', 'Science-Fiction'],
    overview: 'Un pirate informatique découvre que la réalité est une simulation.',
  },
  {
    id: 1124,
    title: 'Le Prestige',
    originalTitle: 'The Prestige',
    releaseDate: '2006-10-17',
    runtime: 130,
    genres: ['Drame', 'Mystère'],
    overview: 'Deux magiciens rivaux se livrent une lutte obsessionnelle.',
  },
  {
    id: 13,
    title: 'Forrest Gump',
    releaseDate: '1994-06-23',
    runtime: 142,
    genres: ['Comédie', 'Drame', 'Romance'],
    overview: 'Le parcours extraordinaire d’un homme simple à travers l’histoire américaine.',
  },
]

const series: DemoSeries[] = [
  {
    id: 1396,
    title: 'Breaking Bad',
    firstAirDate: '2008-01-20',
    genres: ['Drame', 'Crime'],
    overview:
      'Un professeur de chimie atteint d’un cancer se lance dans la fabrication de méthamphétamine.',
    seasons: [
      { episodes: 7, airDate: '2008-01-20' },
      { episodes: 13, airDate: '2009-03-08' },
      { episodes: 13, airDate: '2010-03-21' },
      { episodes: 13, airDate: '2011-07-17' },
      { episodes: 16, airDate: '2012-07-15' },
    ],
  },
  {
    id: 60059,
    title: 'Better Call Saul',
    firstAirDate: '2015-02-08',
    genres: ['Crime', 'Drame'],
    overview: 'Les débuts de l’avocat Jimmy McGill, six ans avant Breaking Bad.',
    seasons: [
      { episodes: 10, airDate: '2015-02-08' },
      { episodes: 10, airDate: '2016-02-15' },
      { episodes: 10, airDate: '2017-04-10' },
      { episodes: 10, airDate: '2018-08-06' },
      { episodes: 10, airDate: '2020-02-23' },
      { episodes: 13, airDate: '2022-04-18' },
    ],
  },
  {
    id: 1399,
    title: 'Game of Thrones',
    firstAirDate: '2011-04-17',
    genres: ['Drame', 'Fantastique'],
    overview: 'Les grandes familles de Westeros s’affrontent pour le Trône de fer.',
    seasons: [10, 10, 10, 10, 10, 10, 7, 6].map((episodes, index) => ({
      episodes,
      airDate: `${String(2011 + index)}-04-17`,
    })),
  },
  {
    id: 70523,
    title: 'Dark',
    firstAirDate: '2017-12-01',
    genres: ['Drame', 'Mystère', 'Science-Fiction'],
    overview:
      'La disparition d’enfants révèle les secrets de quatre familles d’une petite ville allemande.',
    seasons: [
      { episodes: 10, airDate: '2017-12-01' },
      { episodes: 8, airDate: '2019-06-21' },
      { episodes: 8, airDate: '2020-06-27' },
    ],
  },
  {
    id: 87108,
    title: 'Chernobyl',
    firstAirDate: '2019-05-06',
    genres: ['Drame', 'Histoire'],
    overview: 'La catastrophe nucléaire de 1986 et les sacrifices faits pour sauver l’Europe.',
    seasons: [{ episodes: 5, airDate: '2019-05-06' }],
  },
  {
    id: 76331,
    title: 'Succession',
    firstAirDate: '2018-06-03',
    genres: ['Drame'],
    overview: 'La famille Roy se déchire pour le contrôle d’un empire médiatique.',
    seasons: [
      { episodes: 10, airDate: '2018-06-03' },
      { episodes: 10, airDate: '2019-08-11' },
      { episodes: 9, airDate: '2021-10-17' },
      { episodes: 10, airDate: '2023-03-26' },
    ],
  },
  {
    id: 136315,
    title: 'The Bear',
    firstAirDate: '2022-06-23',
    genres: ['Comédie', 'Drame'],
    overview: 'Un jeune chef reprend la sandwicherie familiale à Chicago.',
    inProduction: true,
    seasons: [
      { episodes: 8, airDate: '2022-06-23' },
      { episodes: 10, airDate: '2023-06-22' },
      { episodes: 10, airDate: '2024-06-26' },
      { episodes: 10, airDate: '2025-06-25' },
      { episodes: 0, airDate: null },
    ],
  },
  {
    id: 2316,
    title: 'The Office',
    firstAirDate: '2005-03-24',
    genres: ['Comédie'],
    overview: 'Le quotidien absurde des employés d’une entreprise de papier en Pennsylvanie.',
    seasons: [6, 22, 25, 19, 28, 26, 26, 24, 25].map((episodes, index) => ({
      episodes,
      airDate: `${String(2005 + index)}-09-20`,
    })),
  },
]

function seriesSummary(item: DemoSeries): MediaSummary {
  return {
    mediaType: 'tv',
    tmdbId: item.id,
    title: item.title,
    originalTitle: item.originalTitle ?? null,
    posterPath: null,
    releaseDate: item.firstAirDate,
  }
}

function movieSummary(item: DemoMovie): MediaSummary {
  return {
    mediaType: 'movie',
    tmdbId: item.id,
    title: item.title,
    originalTitle: item.originalTitle ?? null,
    posterPath: null,
    releaseDate: item.releaseDate,
  }
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

function delay<T>(value: T, signal?: AbortSignal, ms = 250): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      resolve(value)
    }, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })
}

function notFound(): Error {
  return new Error('Not found in demo catalog')
}

export const demoCatalog: CatalogSource = {
  search(query, signal) {
    const needle = normalize(query.trim())
    const results = [...series.map(seriesSummary), ...movies.map(movieSummary)].filter((item) =>
      [item.title, item.originalTitle ?? ''].some((title) => normalize(title).includes(needle)),
    )
    return delay(results, signal)
  },

  getMovie(tmdbId, signal) {
    const movie = movies.find((item) => item.id === tmdbId)
    if (!movie) return Promise.reject(notFound())

    const details: MovieDetails = {
      ...movieSummary(movie),
      mediaType: 'movie',
      overview: movie.overview,
      backdropPath: null,
      runtimeMinutes: movie.runtime,
      genres: movie.genres,
    }
    return delay(details, signal)
  },

  getSeries(tmdbId, signal) {
    const item = series.find((entry) => entry.id === tmdbId)
    if (!item) return Promise.reject(notFound())

    const seasons: SeasonSummary[] = item.seasons.map((season, index) => ({
      seasonNumber: index + 1,
      name: `Saison ${String(index + 1)}`,
      episodeCount: season.episodes,
      airDate: season.airDate,
      posterPath: null,
    }))

    const details: SeriesDetails = {
      ...seriesSummary(item),
      mediaType: 'tv',
      overview: item.overview,
      backdropPath: null,
      genres: item.genres,
      seasons,
      inProduction: item.inProduction ?? false,
    }
    return delay(details, signal)
  },
}
