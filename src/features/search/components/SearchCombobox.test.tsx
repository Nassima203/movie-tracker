import type * as CatalogModule from '@/features/catalog/catalog'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { demoCatalog } from '@/features/catalog/sources/demoCatalog'
import { createDemoLibraryRepository } from '@/features/library/repository/demoRepository'
import { renderWithProviders } from '../../../../tests/utils/renderWithProviders'
import { SearchCombobox } from './SearchCombobox'

const { repository } = vi.hoisted(() => ({
  repository: {
    list: vi.fn(),
    upsert: vi.fn(),
    remove: vi.fn(),
    setSeasonsWatched: vi.fn(),
  },
}))

vi.mock('@/features/library/repository', () => ({ libraryRepository: repository }))
vi.mock('@/features/catalog/catalog', async (importOriginal) => ({
  ...(await importOriginal<typeof CatalogModule>()),
  catalog: demoCatalog,
}))

beforeEach(() => {
  // In-memory behaviour of a real repository, observable through the spies.
  localStorage.clear()
  const store = createDemoLibraryRepository(0)
  repository.list.mockImplementation(() => store.list())
  repository.upsert.mockImplementation((input: Parameters<typeof store.upsert>[0]) =>
    store.upsert(input),
  )
  repository.remove.mockImplementation((ref: Parameters<typeof store.remove>[0]) =>
    store.remove(ref),
  )
  repository.setSeasonsWatched.mockImplementation(
    (id: number, seasons: number[], watched: boolean) =>
      store.setSeasonsWatched(id, seasons, watched),
  )
})

async function typeQuery(query: string) {
  const user = userEvent.setup()
  const input = screen.getByRole('combobox', { name: 'Rechercher un film ou une série' })
  await user.type(input, query)
  await screen.findByRole('row', undefined, { timeout: 2000 })
  return { user, input }
}

describe('SearchCombobox', () => {
  it('starts closed and shows results with type and year', async () => {
    renderWithProviders(<SearchCombobox variant="popover" />)
    const input = screen.getByRole('combobox')
    expect(input).toHaveAttribute('aria-expanded', 'false')

    await typeQuery('incep')

    expect(input).toHaveAttribute('aria-expanded', 'true')
    const row = screen.getByRole('row')
    expect(within(row).getByText('Inception')).toBeInTheDocument()
    expect(within(row).getByText('Film')).toBeInTheDocument()
    expect(within(row).getByText('2010')).toBeInTheDocument()
  })

  it('shows an empty state', async () => {
    renderWithProviders(<SearchCombobox variant="popover" />)
    await userEvent.type(screen.getByRole('combobox'), 'xyzxyz')

    expect(await screen.findByText(/Aucun résultat pour/)).toBeInTheDocument()
  })

  it('navigates results with arrows and opens a title with Enter', async () => {
    const { router } = renderWithProviders(<SearchCombobox variant="popover" />)
    const { user, input } = await typeQuery('breaking')

    await user.keyboard('{ArrowDown}')
    const activeId = input.getAttribute('aria-activedescendant')
    expect(activeId).toBeTruthy()
    expect(document.getElementById(activeId ?? '')).toHaveAttribute('aria-selected', 'true')

    await user.keyboard('{Enter}')
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/series/1396')
    })
  })

  it('adds a result to the watchlist from the keyboard', async () => {
    renderWithProviders(<SearchCombobox variant="popover" />)
    const { user } = await typeQuery('incep')

    await user.keyboard('{ArrowDown}{ArrowRight}{Enter}')

    await waitFor(() => {
      expect(repository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ mediaType: 'movie', tmdbId: 27205, status: 'watchlist' }),
      )
    })
    expect(
      await screen.findByRole('button', { name: /Dans ma liste : Inception/ }),
    ).toBeInTheDocument()
  })

  it('ignores repeated clicks while the action is pending (no duplicates)', async () => {
    let resolveUpsert: () => void = () => undefined
    repository.upsert.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveUpsert = resolve
        }),
    )
    renderWithProviders(<SearchCombobox variant="popover" />)
    const { user } = await typeQuery('incep')

    const button = screen.getByRole('button', { name: 'À voir : Inception' })
    await user.click(button)
    await user.click(button)
    await user.click(button)
    resolveUpsert()

    expect(repository.upsert).toHaveBeenCalledTimes(1)
  })

  it('marks a series as watched with all aired seasons', async () => {
    renderWithProviders(<SearchCombobox variant="popover" />)
    const { user } = await typeQuery('chernobyl')

    await user.click(screen.getByRole('button', { name: 'Marquer vu : Chernobyl' }))

    await waitFor(() => {
      expect(repository.setSeasonsWatched).toHaveBeenCalledWith(87108, [1], true)
    })
    expect(repository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ tmdbId: 87108, status: 'watched', seasonCount: 1 }),
    )
  })

  it('rolls back and shows a friendly message when saving fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    repository.upsert.mockRejectedValue(new Error('duplicate key value violates unique constraint'))
    renderWithProviders(<SearchCombobox variant="popover" />)
    const { user } = await typeQuery('incep')

    await user.click(screen.getByRole('button', { name: 'À voir : Inception' }))

    expect(
      await screen.findByText('Impossible d’ajouter ce titre à votre liste.'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/duplicate key/)).not.toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'À voir : Inception' })).toBeInTheDocument()
  })

  it('closes with Escape, then clears with a second Escape', async () => {
    renderWithProviders(<SearchCombobox variant="popover" />)
    const { user, input } = await typeQuery('incep')

    await user.keyboard('{Escape}')
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(input).toHaveValue('incep')

    await user.keyboard('{Escape}')
    expect(input).toHaveValue('')
  })
})
