import {
  clearPostLoginRedirect,
  readPostLoginRedirect,
  rememberPostLoginRedirect,
  toSafeRedirectPath,
} from './redirect'

describe('toSafeRedirectPath', () => {
  it.each(['/watchlist', '/series/1396?tab=seasons', '/library#top'])(
    'keeps in-app path %s',
    (path) => {
      expect(toSafeRedirectPath(path)).toBe(path)
    },
  )

  it.each([
    'https://evil.com',
    '//evil.com',
    '/\\evil.com',
    'javascript:alert(1)',
    'watchlist',
    '/login',
    '/login?next=/',
    '',
    null,
    undefined,
    42,
  ])('falls back to "/" for unsafe value %s', (value) => {
    expect(toSafeRedirectPath(value)).toBe('/')
  })
})

describe('post-login redirect storage', () => {
  afterEach(() => {
    sessionStorage.clear()
  })

  it('remembers, reads and clears the target path', () => {
    rememberPostLoginRedirect('/watchlist')
    expect(readPostLoginRedirect()).toBe('/watchlist')

    clearPostLoginRedirect()
    expect(readPostLoginRedirect()).toBe('/')
  })

  it('sanitizes stored values', () => {
    sessionStorage.setItem('uwatch:post-login-redirect', '//evil.com')
    expect(readPostLoginRedirect()).toBe('/')
  })
})
