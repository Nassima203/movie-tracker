import { fetchFromTmdbProxy, TmdbProxyError } from './tmdb'

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }))

vi.mock('@/lib/supabase', () => ({ supabase: { auth: { getSession } } }))

function mockSession(accessToken: string | null) {
  getSession.mockResolvedValue({
    data: { session: accessToken ? { access_token: accessToken } : null },
    error: null,
  })
}

describe('fetchFromTmdbProxy', () => {
  it('calls the proxy with the session token', async () => {
    mockSession('user-jwt')
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ id: 1 }))

    await expect(fetchFromTmdbProxy({ resource: 'season', id: 1396, season: 2 })).resolves.toEqual({
      id: 1,
    })

    const [url, init] = fetchMock.mock.calls[0] ?? []
    expect(url).toBe('/api/tmdb?resource=season&id=1396&season=2')
    expect(new Headers(init?.headers).get('authorization')).toBe('Bearer user-jwt')
  })

  it('fails without a session and never calls the network', async () => {
    mockSession(null)
    const fetchMock = vi.spyOn(globalThis, 'fetch')

    await expect(fetchFromTmdbProxy({ resource: 'movie', id: 1 })).rejects.toMatchObject({
      kind: 'unauthorized',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([
    [401, 'unauthorized'],
    [404, 'not_found'],
    [429, 'rate_limited'],
    [502, 'server'],
    [504, 'timeout'],
  ] as const)('maps HTTP %i to %s', async (status, kind) => {
    mockSession('user-jwt')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({}, { status }))

    const error: unknown = await fetchFromTmdbProxy({ resource: 'tv', id: 1 }).catch(
      (e: unknown) => e,
    )
    expect(error).toBeInstanceOf(TmdbProxyError)
    expect(error).toMatchObject({ kind, status })
  })

  it('rethrows caller aborts untouched', async () => {
    mockSession('user-jwt')
    const controller = new AbortController()
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      controller.abort()
      return Promise.reject(new DOMException('aborted', 'AbortError'))
    })

    await expect(
      fetchFromTmdbProxy({ resource: 'search', query: 'a' }, { signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('reports network failures', async () => {
    mockSession('user-jwt')
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(fetchFromTmdbProxy({ resource: 'movie', id: 1 })).rejects.toMatchObject({
      kind: 'network',
    })
  })

  it('reports a proxy without TMDB token as not configured', async () => {
    mockSession('user-jwt')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({ error: { code: 'server_misconfigured' } }, { status: 500 }),
    )

    await expect(fetchFromTmdbProxy({ resource: 'trending' })).rejects.toMatchObject({
      kind: 'not_configured',
    })
  })

  it('reports a host without the proxy (HTML answer) as not configured', async () => {
    mockSession('user-jwt')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('<!doctype html>', { headers: { 'Content-Type': 'text/html' } }),
    )

    await expect(fetchFromTmdbProxy({ resource: 'trending' })).rejects.toMatchObject({
      kind: 'not_configured',
    })
  })
})
