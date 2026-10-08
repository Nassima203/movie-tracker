// @vitest-environment node
import { resolveTmdbRoute } from './routes.js'

function resolve(query: string) {
  return resolveTmdbRoute(new URLSearchParams(query))
}

describe('resolveTmdbRoute', () => {
  it('builds a multi search with forced safe parameters', () => {
    expect(resolve('resource=search&query=%20breaking%20&include_adult=true&language=en')).toEqual({
      ok: true,
      upstream: {
        path: '/3/search/multi',
        params: { query: 'breaking', page: '1', include_adult: 'false', language: 'fr-FR' },
        maxAge: 300,
      },
    })
  })

  it('accepts a single-character search (search starts at the first character)', () => {
    expect(resolve('resource=search&query=a').ok).toBe(true)
  })

  it.each(['', '%20%20', 'x'.repeat(101)])('rejects invalid query "%s"', (query) => {
    expect(resolve(`resource=search&query=${query}`).ok).toBe(false)
  })

  it.each(['0', '501', '-1', '1.5', 'abc'])('rejects invalid page %s', (page) => {
    expect(resolve(`resource=search&query=a&page=${page}`).ok).toBe(false)
  })

  it('builds the weekly trending list', () => {
    expect(resolve('resource=trending')).toEqual({
      ok: true,
      upstream: { path: '/3/trending/all/week', params: { language: 'fr-FR' }, maxAge: 3600 },
    })
  })

  it.each(['movie', 'tv'] as const)('builds %s details', (resource) => {
    const result = resolve(`resource=${resource}&id=1396`)
    expect(result).toMatchObject({ ok: true, upstream: { path: `/3/${resource}/1396` } })
  })

  it('builds season details, including specials (season 0)', () => {
    expect(resolve('resource=season&id=1396&season=0')).toMatchObject({
      ok: true,
      upstream: { path: '/3/tv/1396/season/0' },
    })
  })

  it.each([
    'resource=movie',
    'resource=movie&id=0',
    'resource=movie&id=../../account',
    'resource=movie&id=1%2F..%2Faccount',
    'resource=tv&id=99999999999',
    'resource=season&id=1',
    'resource=season&id=1&season=-1',
    'resource=account',
    'resource=../3/account',
    '',
  ])('rejects %s', (query) => {
    expect(resolve(query).ok).toBe(false)
  })
})
