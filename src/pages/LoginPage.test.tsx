import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { signInWithProvider } from '@/features/auth/authService'
import { fakeUser, renderRoutesWithAuth } from '../../tests/utils/renderWithAuth'
import { LoginPage } from './LoginPage'

vi.mock('@/features/auth/authService', () => ({
  signInWithProvider: vi.fn(),
  signOut: vi.fn(),
}))

const routes = [
  { path: '/login', Component: LoginPage },
  { path: '/', element: <h1>Home</h1> },
  { path: '/watchlist', element: <h1>Watchlist</h1> },
]

describe('LoginPage', () => {
  afterEach(() => {
    sessionStorage.clear()
  })

  it('starts the Google OAuth flow and remembers the requested page', async () => {
    vi.mocked(signInWithProvider).mockReturnValue(new Promise(() => undefined))
    renderRoutesWithAuth({ status: 'anonymous' }, routes, {
      pathname: '/login',
      state: { from: '/watchlist' },
    })

    await userEvent.click(screen.getByRole('button', { name: 'Continuer avec Google' }))

    expect(signInWithProvider).toHaveBeenCalledWith('google')
    expect(sessionStorage.getItem('uwatch:post-login-redirect')).toBe('/watchlist')
    expect(screen.getByRole('button', { name: 'Continuer avec GitHub' })).toBeDisabled()
  })

  it('shows a friendly error when the OAuth flow cannot start', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.mocked(signInWithProvider).mockRejectedValue(new Error('provider is not enabled'))
    renderRoutesWithAuth({ status: 'anonymous' }, routes, '/login')

    await userEvent.click(screen.getByRole('button', { name: 'Continuer avec GitHub' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Impossible de démarrer la connexion. Veuillez réessayer.',
    )
    expect(screen.queryByText(/provider is not enabled/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continuer avec GitHub' })).toBeEnabled()
  })

  it('shows the OAuth error returned in the redirect URL', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    renderRoutesWithAuth({ status: 'anonymous' }, routes, '/login?error=access_denied')

    expect(screen.getByRole('alert')).toHaveTextContent('Connexion annulée ou accès refusé.')
  })

  it('redirects an authenticated user to the remembered page', async () => {
    sessionStorage.setItem('uwatch:post-login-redirect', '/watchlist')
    renderRoutesWithAuth({ status: 'authenticated', user: fakeUser }, routes, '/login')

    expect(await screen.findByRole('heading', { name: 'Watchlist' })).toBeInTheDocument()
    expect(sessionStorage.getItem('uwatch:post-login-redirect')).toBeNull()
  })

  it('waits for the session before rendering login buttons', () => {
    renderRoutesWithAuth({ status: 'loading' }, routes, '/login')

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
