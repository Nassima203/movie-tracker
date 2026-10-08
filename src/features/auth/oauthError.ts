/**
 * Reads an OAuth error returned by Supabase Auth in the redirect URL
 * (query string for PKCE, fragment for the implicit flow) and maps it to a
 * user-facing message. Raw provider messages are never shown to the user.
 */
export function getOAuthErrorMessage(location: Pick<Location, 'search' | 'hash'>): string | null {
  const query = new URLSearchParams(location.search)
  const fragment = new URLSearchParams(location.hash.replace(/^#/, ''))

  const error = query.get('error') ?? fragment.get('error')
  const description = query.get('error_description') ?? fragment.get('error_description')

  if (!error && !description) return null

  if (import.meta.env.DEV) {
    console.error('[auth] OAuth redirect error', { error, description })
  }

  if (error === 'access_denied') {
    return 'Connexion annulée ou accès refusé.'
  }

  return 'La connexion a échoué. Veuillez réessayer.'
}
