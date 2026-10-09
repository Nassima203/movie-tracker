import { getAuthRedirectErrorMessage } from './authRedirectError'

describe('getAuthRedirectErrorMessage', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('returns null when the URL has no error', () => {
    expect(getAuthRedirectErrorMessage({ search: '?foo=bar', hash: '' })).toBeNull()
  })

  it('maps access_denied from the query string', () => {
    expect(getAuthRedirectErrorMessage({ search: '?error=access_denied', hash: '' })).toBe(
      'Connexion annulée ou accès refusé.',
    )
  })

  it('reads errors from the fragment and never exposes the raw description', () => {
    const message = getAuthRedirectErrorMessage({
      search: '',
      hash: '#error=server_error&error_description=Database+error+saving+new+user',
    })

    expect(message).toBe('La connexion a échoué. Veuillez réessayer.')
    expect(message).not.toContain('Database')
  })
})
