import type * as CatalogModule from '@/features/catalog/catalog'
import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { MediaSummary } from '@/types/media'
import { createTestQueryClient } from '../../../../tests/utils/renderWithProviders'
import { useTmdbSearch } from './useTmdbSearch'

const { search } = vi.hoisted(() => ({
  search: vi.fn<(query: string, signal?: AbortSignal) => Promise<MediaSummary[]>>(),
}))

vi.mock('@/features/catalog/catalog', async (importOriginal) => ({
  ...(await importOriginal<typeof CatalogModule>()),
  catalog: { search, getMovie: vi.fn(), getSeries: vi.fn() },
}))

const inception: MediaSummary = {
  mediaType: 'movie',
  tmdbId: 27205,
  title: 'Inception',
  originalTitle: null,
  posterPath: null,
  releaseDate: '2010-07-15',
}

function setup(initialQuery: string) {
  const client = createTestQueryClient()
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return renderHook(({ query }) => useTmdbSearch(query), {
    wrapper,
    initialProps: { query: initialQuery },
  })
}

describe('useTmdbSearch', () => {
  it('stays idle and sends nothing for an empty or blank query', async () => {
    const { result } = setup('   ')
    await new Promise((resolve) => setTimeout(resolve, 400))

    expect(result.current.status).toBe('idle')
    expect(search).not.toHaveBeenCalled()
  })

  it('searches from the first character, after the debounce', async () => {
    search.mockResolvedValue([inception])
    const { result, rerender } = setup('')
    rerender({ query: 'i' })

    expect(result.current.status).toBe('loading')
    expect(search).not.toHaveBeenCalled()
    await waitFor(() => {
      expect(result.current.status).toBe('success')
    })
    expect(result.current.results).toEqual([inception])
    expect(search).toHaveBeenCalledTimes(1)
    expect(search).toHaveBeenCalledWith('i', expect.any(AbortSignal))
  })

  it('reports an empty result', async () => {
    search.mockResolvedValue([])
    const { result, rerender } = setup('')
    rerender({ query: 'zzz' })

    await waitFor(() => {
      expect(result.current.status).toBe('empty')
    })
  })

  it('reports an error', async () => {
    search.mockRejectedValue(new Error('boom'))
    const { result, rerender } = setup('')
    rerender({ query: 'err' })

    await waitFor(
      () => {
        expect(result.current.status).toBe('error')
      },
      { timeout: 3000 },
    )
  })

  it('only sends the last query when typing fast', async () => {
    search.mockResolvedValue([inception])
    const { result, rerender } = setup('')
    rerender({ query: 'i' })
    rerender({ query: 'in' })
    rerender({ query: 'inc' })

    await waitFor(() => {
      expect(result.current.status).toBe('success')
    })
    expect(search).toHaveBeenCalledTimes(1)
    expect(search).toHaveBeenCalledWith('inc', expect.any(AbortSignal))
  })

  it('aborts the stale request when the query changes', async () => {
    let firstSignal: AbortSignal | undefined
    search.mockImplementationOnce((_query, signal) => {
      firstSignal = signal
      return new Promise(() => undefined)
    })
    search.mockResolvedValueOnce([inception])

    const { result, rerender } = setup('')
    rerender({ query: 'a' })
    await waitFor(() => {
      expect(search).toHaveBeenCalledTimes(1)
    })

    rerender({ query: 'inception' })
    await waitFor(() => {
      expect(result.current.status).toBe('success')
    })
    expect(firstSignal?.aborted).toBe(true)
  })
})
