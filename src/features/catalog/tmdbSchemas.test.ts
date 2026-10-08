import { parseMovieDetails, parseSearchResponse, parseSeriesDetails } from './tmdbSchemas'

describe('parseSearchResponse', () => {
  it('keeps movies and series, drops people and malformed items', () => {
    const results = parseSearchResponse({
      results: [
        {
          media_type: 'tv',
          id: 1396,
          name: 'Breaking Bad',
          original_name: 'Breaking Bad',
          poster_path: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
          first_air_date: '2008-01-20',
        },
        { media_type: 'person', id: 17419, name: 'Bryan Cranston' },
        { media_type: 'movie', id: 'not-a-number', title: 'Broken' },
        {
          media_type: 'movie',
          id: 27205,
          title: 'Inception',
          original_title: 'Inception',
          release_date: '2010-07-15',
        },
        null,
      ],
    })

    expect(results).toEqual([
      {
        mediaType: 'tv',
        tmdbId: 1396,
        title: 'Breaking Bad',
        originalTitle: null,
        posterPath: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
        releaseDate: '2008-01-20',
      },
      {
        mediaType: 'movie',
        tmdbId: 27205,
        title: 'Inception',
        originalTitle: null,
        posterPath: null,
        releaseDate: '2010-07-15',
      },
    ])
  })

  it('handles missing or partial fields', () => {
    const [item] = parseSearchResponse({
      results: [
        {
          media_type: 'movie',
          id: 1,
          title: '  ',
          original_title: 'Original',
          release_date: '',
          poster_path: 'javascript:alert(1)',
        },
      ],
    })

    expect(item).toEqual({
      mediaType: 'movie',
      tmdbId: 1,
      title: 'Original',
      originalTitle: null,
      posterPath: null,
      releaseDate: null,
    })
  })

  it('falls back to a placeholder title', () => {
    expect(parseSearchResponse({ results: [{ media_type: 'tv', id: 2 }] })[0]?.title).toBe(
      'Sans titre',
    )
  })

  it('tolerates a response without results', () => {
    expect(parseSearchResponse({})).toEqual([])
  })
})

describe('parseMovieDetails', () => {
  it('normalizes movie details', () => {
    const movie = parseMovieDetails({
      id: 27205,
      title: 'Inception',
      original_title: 'Inception',
      overview: ' Un voleur… ',
      runtime: 148,
      genres: [{ name: 'Action' }, { name: null }, {}],
      backdrop_path: '/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
    })

    expect(movie).toMatchObject({
      mediaType: 'movie',
      overview: 'Un voleur…',
      runtimeMinutes: 148,
      genres: ['Action'],
      backdropPath: '/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
      releaseDate: null,
    })
  })

  it('rejects a payload without a valid id', () => {
    expect(() => parseMovieDetails({ title: 'x' })).toThrow()
  })
})

describe('parseSeriesDetails', () => {
  it('sorts seasons and names unnamed ones', () => {
    const series = parseSeriesDetails({
      id: 1396,
      name: 'Breaking Bad',
      in_production: false,
      seasons: [
        { season_number: 2, name: 'Saison 2', episode_count: 13, air_date: '2009-03-08' },
        { season_number: 0, name: 'Épisodes spéciaux', episode_count: 9, air_date: null },
        { season_number: 1, episode_count: 7, air_date: '2008-01-20' },
        { season_number: -1 },
      ],
    })

    expect(series.seasons.map((season) => [season.seasonNumber, season.name])).toEqual([
      [0, 'Épisodes spéciaux'],
      [1, 'Saison 1'],
      [2, 'Saison 2'],
    ])
  })
})
