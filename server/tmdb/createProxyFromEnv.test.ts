// @vitest-environment node
import { createProxyFromEnv } from './createProxyFromEnv.js'

function get(query: string) {
  return new Request(`http://localhost/api/tmdb?${query}`)
}

describe('createProxyFromEnv', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('reports a missing TMDB token as a configuration problem', async () => {
    const handle = createProxyFromEnv({}, { allowAnonymousWithoutSupabase: true })
    const response = await handle(get('resource=trending'))

    expect(response.status).toBe(500)
    expect(await response.json()).toMatchObject({ error: { code: 'server_misconfigured' } })
  })

  it('never serves anonymous requests in production when Supabase is missing', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const handle = createProxyFromEnv(
      { TMDB_READ_ACCESS_TOKEN: 'secret' },
      { allowAnonymousWithoutSupabase: false },
    )

    expect((await handle(get('resource=trending'))).status).toBe(500)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('serves anonymous requests locally when Supabase is missing', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ results: [] }))
    const handle = createProxyFromEnv(
      { TMDB_READ_ACCESS_TOKEN: 'secret' },
      { allowAnonymousWithoutSupabase: true },
    )

    expect((await handle(get('resource=trending'))).status).toBe(200)
    expect(fetchSpy.mock.calls[0]?.[0]).toBe(
      'https://api.themoviedb.org/3/trending/all/week?language=fr-FR',
    )
  })

  it('requires a session as soon as Supabase is configured, even locally', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const handle = createProxyFromEnv(
      {
        TMDB_READ_ACCESS_TOKEN: 'secret',
        VITE_SUPABASE_URL: 'https://example.supabase.co',
        VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_x',
      },
      { allowAnonymousWithoutSupabase: true },
    )

    expect((await handle(get('resource=trending'))).status).toBe(401)
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
