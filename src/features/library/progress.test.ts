import type { LibraryItem, SeasonSummary } from '@/types/media'
import { airedRegularSeasons, categorize, computeSeriesProgress } from './progress'

function season(seasonNumber: number, airDate: string | null): SeasonSummary {
  return {
    seasonNumber,
    name: `S${String(seasonNumber)}`,
    episodeCount: 10,
    airDate,
    posterPath: null,
  }
}

function item(overrides: Partial<LibraryItem>): LibraryItem {
  return {
    mediaType: 'tv',
    tmdbId: 1,
    title: 'Show',
    originalTitle: null,
    posterPath: null,
    releaseDate: null,
    status: 'watchlist',
    seasonCount: 3,
    addedAt: '2026-01-01T00:00:00Z',
    watchedAt: null,
    updatedAt: '2026-01-01T00:00:00Z',
    watchedSeasons: [],
    ...overrides,
  }
}

describe('airedRegularSeasons', () => {
  it('excludes specials, unannounced and future seasons', () => {
    const seasons = [
      season(0, '2010-01-01'),
      season(1, '2020-01-01'),
      season(2, '2026-10-08'),
      season(3, '2027-01-01'),
      season(4, null),
    ]
    const aired = airedRegularSeasons(seasons, new Date('2026-10-08T12:00:00Z'))
    expect(aired.map((s) => s.seasonNumber)).toEqual([1, 2])
  })
})

describe('computeSeriesProgress', () => {
  it.each([
    [[], 'not_started', 0],
    [[1], 'in_progress', 1],
    [[1, 2, 3], 'completed', 3],
    [[0, 1], 'in_progress', 1],
  ] as const)('watched %j of 3 → %s', (watchedSeasons, state, watched) => {
    const progress = computeSeriesProgress({ watchedSeasons: [...watchedSeasons], seasonCount: 3 })
    expect(progress.state).toBe(state)
    expect(progress.watched).toBe(watched)
  })

  it('reports an unknown total', () => {
    expect(computeSeriesProgress({ watchedSeasons: [], seasonCount: null }).state).toBe('unknown')
  })
})

describe('categorize', () => {
  it('uses the stored status for movies', () => {
    expect(
      categorize(
        item({ mediaType: 'movie', seasonCount: null, status: 'watched', watchedAt: 'x' }),
      ),
    ).toBe('watched')
  })

  it('derives series categories from season progress', () => {
    expect(categorize(item({ watchedSeasons: [] }))).toBe('watchlist')
    expect(categorize(item({ watchedSeasons: [1] }))).toBe('in_progress')
    expect(categorize(item({ watchedSeasons: [1, 2, 3] }))).toBe('watched')
  })

  it('moves a finished series back to "in progress" when a new season airs', () => {
    expect(categorize(item({ status: 'watched', watchedSeasons: [1, 2, 3], seasonCount: 4 }))).toBe(
      'in_progress',
    )
  })

  it('puts titles marked "en cours" in progress', () => {
    expect(categorize(item({ mediaType: 'movie', seasonCount: null, status: 'watching' }))).toBe(
      'in_progress',
    )
    expect(categorize(item({ status: 'watching', watchedSeasons: [] }))).toBe('in_progress')
  })

  it('keeps a completed series watched even if it was marked "en cours"', () => {
    expect(categorize(item({ status: 'watching', watchedSeasons: [1, 2, 3] }))).toBe('watched')
  })
})
