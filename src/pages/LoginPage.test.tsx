import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { requestPasswordReset, signIn, signUp } from '@/features/auth/authService'
import { AuthFailure } from '@/features/auth/types'
import { fakeUser, renderRoutesWithAuth } from '../../tests/utils/renderWithAuth'
import { LoginPage } from './LoginPage'

vi.mock('@/features/auth/authService', () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  requestPasswordReset: vi.fn(),
}))

const routes = [
  { path: '/login', Component: LoginPage },
  { path: '/reset-password', element: <h1>Reset page</h1> },
  { path: '/', element: <h1>Home</h1> },
  { path: '/watchlist', element: <h1>Watchlist</h1> },
]

async function fill(label: RegExp | string, value: string) {
  await userEvent.type(screen.getByLabelText(label), value)
}

describe('LoginPage', () => {
  afterEach(() => {
    sessionStorage.clear()
    localStorage.clear()
  })

  it('signs in with email and password and remembers the requested page', async () => {
    vi.mocked(signIn).mockReturnValue(new Promise(() => undefined))
    renderRoutesWithAuth({ status: 'anonymous' }, routes, {
      pathname: '/login',
      state: { from: '/watchlist' },
    })

    await fill('Adresse email', ' Me@Example.com ')
    await fill('Mot de passe', 'secret123')
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }))

    expect(signIn).toHaveBeenCalledWith({ email: 'me@example.com', password: 'secret123' })
    expect(sessionStorage.getItem('uwatch:post-login-redirect')).toBe('/watchlist')
    expect(screen.getByRole('button', { name: 'Se connecter' })).toBeDisabled()
  })

  it('validates the form before calling the server', async () => {
    renderRoutesWithAuth({ status: 'anonymous' }, routes, '/login')

    await fill('Adresse email', 'not-an-email')
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }))

    expect(screen.getByText('Saisissez une adresse email valide.')).toBeInTheDocument()
    expect(screen.getByText('Saisissez votre mot de passe.')).toBeInTheDocument()
    expect(signIn).not.toHaveBeenCalled()
  })

  it('shows a clear message for wrong credentials, never the raw error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.mocked(signIn).mockRejectedValue(
      new AuthFailure('invalid_credentials', 'Invalid login credentials'),
    )
    renderRoutesWithAuth({ status: 'anonymous' }, routes, '/login')

    await fill('Adresse email', 'me@example.com')
    await fill('Mot de passe', 'wrong-pass1')
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Email ou mot de passe incorrect.')
    expect(screen.queryByText(/Invalid login credentials/)).not.toBeInTheDocument()
  })

  it('creates an account and asks to confirm the email', async () => {
    vi.mocked(signUp).mockResolvedValue({ status: 'confirmation_required' })
    renderRoutesWithAuth({ status: 'anonymous' }, routes, '/login')

    await userEvent.click(screen.getByRole('button', { name: 'Créer un compte' }))
    await fill('Adresse email', 'me@example.com')
    await fill('Mot de passe', 'secret123')
    await fill('Confirmer le mot de passe', 'secret123')
    await userEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }))

    expect(signUp).toHaveBeenCalledWith({ email: 'me@example.com', password: 'secret123' })
    expect(await screen.findByText(/Un email de confirmation a été envoyé/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Connexion' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('refuses weak or mismatched passwords on sign-up', async () => {
    renderRoutesWithAuth({ status: 'anonymous' }, routes, '/login')

    await userEvent.click(screen.getByRole('button', { name: 'Créer un compte' }))
    await fill('Adresse email', 'me@example.com')
    await fill('Mot de passe', 'short')
    await fill('Confirmer le mot de passe', 'other')
    await userEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }))

    expect(screen.getByText('Au moins 8 caractères.')).toBeInTheDocument()
    expect(screen.getByText('Les deux mots de passe ne correspondent pas.')).toBeInTheDocument()
    expect(signUp).not.toHaveBeenCalled()
  })

  it('explains when the email is not on the allowlist', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.mocked(signUp).mockRejectedValue(
      new AuthFailure('not_allowed', 'This account is not allowed'),
    )
    renderRoutesWithAuth({ status: 'anonymous' }, routes, '/login')

    await userEvent.click(screen.getByRole('button', { name: 'Créer un compte' }))
    await fill('Adresse email', 'intruder@example.com')
    await fill('Mot de passe', 'secret123')
    await fill('Confirmer le mot de passe', 'secret123')
    await userEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Cette adresse email n’est pas autorisée à créer un compte.',
    )
  })

  it('shows an error returned in the redirect URL (expired confirmation link)', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    renderRoutesWithAuth(
      { status: 'anonymous' },
      routes,
      '/login?error=access_denied&error_code=otp_expired',
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Ce lien a expiré')
  })

  it('redirects an authenticated user to the remembered page', async () => {
    sessionStorage.setItem('uwatch:post-login-redirect', '/watchlist')
    renderRoutesWithAuth({ status: 'authenticated', user: fakeUser }, routes, '/login')

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Watchlist' })).toBeInTheDocument()
    })
    expect(sessionStorage.getItem('uwatch:post-login-redirect')).toBeNull()
  })

  it('waits for the session before rendering the form', () => {
    renderRoutesWithAuth({ status: 'loading' }, routes, '/login')

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('sends a password reset link without revealing whether the account exists', async () => {
    vi.mocked(requestPasswordReset).mockResolvedValue(undefined)
    renderRoutesWithAuth({ status: 'anonymous' }, routes, '/login')

    await userEvent.click(screen.getByRole('button', { name: 'Mot de passe oublié ?' }))
    await fill('Adresse email', 'Me@Example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer le lien' }))

    expect(requestPasswordReset).toHaveBeenCalledWith('me@example.com')
    expect(await screen.findByText(/Si un compte existe pour/)).toBeInTheDocument()
    expect(localStorage.getItem('uwatch:password-reset-requested-at')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Se connecter' })).toBeInTheDocument()
  })

  it('opens the new password page when coming back from the reset email', async () => {
    localStorage.setItem('uwatch:password-reset-requested-at', String(Date.now()))
    renderRoutesWithAuth({ status: 'authenticated', user: fakeUser }, routes, '/login')

    expect(await screen.findByRole('heading', { name: 'Reset page' })).toBeInTheDocument()
  })

  it('clears a pending reset after a normal sign-in', async () => {
    localStorage.setItem('uwatch:password-reset-requested-at', String(Date.now()))
    vi.mocked(signIn).mockResolvedValue(undefined)
    renderRoutesWithAuth({ status: 'anonymous' }, routes, '/login')

    await fill('Adresse email', 'me@example.com')
    await fill('Mot de passe', 'secret123')
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }))

    await waitFor(() => {
      expect(localStorage.getItem('uwatch:password-reset-requested-at')).toBeNull()
    })
  })
})
