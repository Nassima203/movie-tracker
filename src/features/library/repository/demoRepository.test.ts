import type { MediaSummary } from '@/types/media'
import { createDemoLibraryRepository } from './demoRepository'

const breakingBad: MediaSummary = {
  mediaType: 'tv',
  tmdbId: 1396,
  title: 'Breaking Bad',
  originalTitle: null,
  posterPath: null,
  releaseDate: '2008-01-20',
}

describe('demo library repository', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('never stores the same media twice', async () => {
    const repository = createDemoLibraryRepository(0)
    await repository.upsert({ ...breakingBad, status: 'watchlist' })
    await repository.upsert({ ...breakingBad, status: 'watched' })

    const items = await repository.list()
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ status: 'watched' })
  })

  it('distinguishes a movie and a series sharing a TMDB id', async () => {
    const repository = createDemoLibraryRepository(0)
    await repository.upsert({ ...breakingBad, status: 'watchlist' })
    await repository.upsert({ ...breakingBad, mediaType: 'movie', status: 'watchlist' })

    expect(await repository.list()).toHaveLength(2)
  })

  it('tracks seasons only for series already in the library', async () => {
    const repository = createDemoLibraryRepository(0)
    await expect(repository.setSeasonsWatched(1396, [1], true)).rejects.toThrow()

    await repository.upsert({ ...breakingBad, status: 'watchlist', seasonCount: 5 })
    await repository.setSeasonsWatched(1396, [2, 1, 1], true)
    await repository.setSeasonsWatched(1396, [2], false)

    expect((await repository.list())[0]?.watchedSeasons).toEqual([1])
  })

  it('removes an entry with its seasons', async () => {
    const repository = createDemoLibraryRepository(0)
    await repository.upsert({ ...breakingBad, status: 'watchlist' })
    await repository.setSeasonsWatched(1396, [1], true)
    await repository.remove(breakingBad)

    expect(await repository.list()).toEqual([])
  })

  it('recovers from corrupted storage', async () => {
    localStorage.setItem('uwatch:demo-library', '{not json')
    expect(await createDemoLibraryRepository(0).list()).toEqual([])
  })
})
