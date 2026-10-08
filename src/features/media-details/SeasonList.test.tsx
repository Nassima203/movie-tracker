import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createDemoLibraryRepository } from '@/features/library/repository/demoRepository'
import type { SeriesDetails } from '@/types/media'
import { renderWithProviders } from '../../../tests/utils/renderWithProviders'
import { SeasonList } from './SeasonList'

const { repository } = vi.hoisted(() => ({
  repository: { list: vi.fn(), upsert: vi.fn(), remove: vi.fn(), setSeasonsWatched: vi.fn() },
}))

vi.mock('@/features/library/repository', () => ({ libraryRepository: repository }))

const series: SeriesDetails = {
  mediaType: 'tv',
  tmdbId: 87108,
  title: 'Mini-série',
  originalTitle: null,
  posterPath: null,
  releaseDate: '2019-05-06',
  overview: null,
  backdropPath: null,
  genres: [],
  inProduction: true,
  seasons: [
    {
      seasonNumber: 0,
      name: 'Épisodes spéciaux',
      episodeCount: 2,
      airDate: null,
      posterPath: null,
    },
    { seasonNumber: 1, name: 'Saison 1', episodeCount: 5, airDate: '2019-05-06', posterPath: null },
    { seasonNumber: 2, name: 'Saison 2', episodeCount: 5, airDate: '2020-05-06', posterPath: null },
    { seasonNumber: 3, name: 'Saison 3', episodeCount: 0, airDate: null, posterPath: null },
  ],
}

beforeEach(() => {
  localStorage.clear()
  const store = createDemoLibraryRepository(0)
  repository.list.mockImplementation(() => store.list())
  repository.upsert.mockImplementation((input: Parameters<typeof store.upsert>[0]) =>
    store.upsert(input),
  )
  repository.setSeasonsWatched.mockImplementation(
    (id: number, seasons: number[], watched: boolean) =>
      store.setSeasonsWatched(id, seasons, watched),
  )
})

describe('SeasonList', () => {
  it('adds the series to the library before tracking its first season', async () => {
    renderWithProviders(<SeasonList series={series} item={null} />)

    await userEvent.click(screen.getByRole('checkbox', { name: /Saison 1/ }))

    await waitFor(() => {
      expect(repository.setSeasonsWatched).toHaveBeenCalledWith(87108, [1], true)
    })
    expect(repository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ tmdbId: 87108, status: 'watchlist', seasonCount: 2 }),
    )
    const upsertOrder = repository.upsert.mock.invocationCallOrder[0] ?? 0
    const seasonOrder = repository.setSeasonsWatched.mock.invocationCallOrder[0] ?? 0
    expect(upsertOrder).toBeLessThan(seasonOrder)
  })

  it('marks every aired season at once and completes the series', async () => {
    renderWithProviders(<SeasonList series={series} item={null} />)

    await userEvent.click(screen.getByRole('button', { name: 'Tout marquer vu' }))

    await waitFor(() => {
      expect(repository.setSeasonsWatched).toHaveBeenCalledWith(87108, [1, 2], true)
    })
    expect(repository.upsert).toHaveBeenCalledWith(expect.objectContaining({ status: 'watched' }))
  })

  it('disables seasons that have not aired yet', () => {
    renderWithProviders(<SeasonList series={series} item={null} />)

    expect(screen.getByRole('checkbox', { name: /Saison 3/ })).toBeDisabled()
    expect(screen.getByText(/Hors progression/)).toBeInTheDocument()
  })
})
