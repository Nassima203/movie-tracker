import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Outlet } from 'react-router'
import { ToastProvider } from '@/components/ui/toast/ToastProvider'
import { updatePassword, verifyEmailLink } from '@/features/auth/authService'
import { AuthFailure } from '@/features/auth/types'
import { fakeUser, renderRoutesWithAuth } from '../../tests/utils/renderWithAuth'
import { ResetPasswordPage } from './ResetPasswordPage'

vi.mock('@/features/auth/authService', () => ({
  updatePassword: vi.fn(),
  verifyEmailLink: vi.fn(),
}))

const PENDING_KEY = 'uwatch:password-reset-requested-at'

// Le fournisseur de toasts enveloppe toutes les routes, pour que le toast
// reste visible après la redirection vers l'accueil.
const routes = [
  {
    element: (
      <ToastProvider>
        <Outlet />
      </ToastProvider>
    ),
    children: [
      { path: '/reset-password', element: <ResetPasswordPage /> },
      { path: '/', element: <h1>Home</h1> },
      { path: '/login', element: <h1>Login</h1> },
    ],
  },
]

const authenticated = { status: 'authenticated', user: fakeUser } as const

async function fill(password: string, confirm = password) {
  await userEvent.type(screen.getByLabelText('Nouveau mot de passe'), password)
  await userEvent.type(screen.getByLabelText('Confirmer le mot de passe'), confirm)
}

function submitButton() {
  return screen.getByRole('button', { name: 'Valider' })
}

describe('ResetPasswordPage', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('explains an invalid or expired link when there is no session', () => {
    renderRoutesWithAuth({ status: 'anonymous' }, routes, '/reset-password')

    expect(screen.getByRole('heading', { name: 'Lien invalide ou expiré' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Retour à la connexion' })).toHaveAttribute(
      'href',
      '/login',
    )
  })

  it('ticks the password criteria while typing', async () => {
    renderRoutesWithAuth(authenticated, routes, '/reset-password')
    const rule = (name: string) => screen.getByText(name).closest('li')

    expect(rule('8 caractères minimum')).toHaveTextContent('non respecté')
    expect(rule('Au moins une lettre')).toHaveTextContent('non respecté')
    expect(rule('Au moins un chiffre')).toHaveTextContent('non respecté')

    await userEvent.type(screen.getByLabelText('Nouveau mot de passe'), 'abc')
    expect(rule('Au moins une lettre')).toHaveTextContent(': respecté')
    expect(rule('Au moins un chiffre')).toHaveTextContent('non respecté')

    await userEvent.type(screen.getByLabelText('Nouveau mot de passe'), '12345')
    expect(rule('8 caractères minimum')).toHaveTextContent(': respecté')
    expect(rule('Au moins un chiffre')).toHaveTextContent(': respecté')
  })

  it('keeps Valider disabled until the form is valid', async () => {
    renderRoutesWithAuth(authenticated, routes, '/reset-password')
    expect(submitButton()).toBeDisabled()

    // Critères non remplis.
    await fill('court1')
    expect(submitButton()).toBeDisabled()

    // Critères remplis mais confirmation différente.
    await userEvent.clear(screen.getByLabelText('Nouveau mot de passe'))
    await userEvent.type(screen.getByLabelText('Nouveau mot de passe'), 'nouveau123')
    expect(submitButton()).toBeDisabled()
    expect(screen.getByLabelText('Confirmer le mot de passe')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(screen.getByText('Les deux mots de passe ne correspondent pas.')).toBeInTheDocument()

    await userEvent.clear(screen.getByLabelText('Confirmer le mot de passe'))
    await userEvent.type(screen.getByLabelText('Confirmer le mot de passe'), 'nouveau123')
    expect(submitButton()).toBeEnabled()
    expect(
      screen.queryByText('Les deux mots de passe ne correspondent pas.'),
    ).not.toBeInTheDocument()
  })

  it('hides the mismatch message until the confirmation is started', async () => {
    renderRoutesWithAuth(authenticated, routes, '/reset-password')

    await userEvent.type(screen.getByLabelText('Nouveau mot de passe'), 'nouveau123')

    expect(
      screen.queryByText('Les deux mots de passe ne correspondent pas.'),
    ).not.toBeInTheDocument()
  })

  it('saves the new password, shows a toast and goes home', async () => {
    localStorage.setItem(PENDING_KEY, String(Date.now()))
    vi.mocked(updatePassword).mockResolvedValue(undefined)
    const router = renderRoutesWithAuth(authenticated, routes, '/reset-password')

    await fill('nouveau123')
    await userEvent.click(submitButton())

    expect(updatePassword).toHaveBeenCalledTimes(1)
    expect(updatePassword).toHaveBeenCalledWith('nouveau123')
    expect(await screen.findByRole('heading', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByText('Mot de passe modifié.')).toBeInTheDocument()
    expect(router.state.historyAction).toBe('REPLACE')
    expect(localStorage.getItem(PENDING_KEY)).toBeNull()
  })

  it('explains server refusals clearly', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.mocked(updatePassword).mockRejectedValue(new AuthFailure('same_password', 'same'))
    renderRoutesWithAuth(authenticated, routes, '/reset-password')

    await fill('ancien123')
    await userEvent.click(submitButton())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Le nouveau mot de passe doit être différent de l’ancien.',
    )
  })

  it('verifies a ?token_hash recovery link, then removes it from the URL', async () => {
    vi.mocked(verifyEmailLink).mockResolvedValue(undefined)
    const router = renderRoutesWithAuth(
      authenticated,
      routes,
      '/reset-password?token_hash=abc123&type=recovery',
    )

    expect(screen.getByText('Vérification du lien…')).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: 'Créer un nouveau mot de passe' }),
    ).toBeInTheDocument()
    expect(verifyEmailLink).toHaveBeenCalledWith('abc123', 'recovery')
    expect(router.state.location.pathname).toBe('/reset-password')
    expect(router.state.location.search).toBe('')
    expect(localStorage.getItem(PENDING_KEY)).not.toBeNull()
  })

  it('shows the expired-link screen when the link is refused', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.mocked(verifyEmailLink).mockRejectedValue(new AuthFailure('link_expired', 'expired'))
    const router = renderRoutesWithAuth(
      { status: 'anonymous' },
      routes,
      '/reset-password?token_hash=old&type=recovery',
    )

    expect(
      await screen.findByRole('heading', { name: 'Lien invalide ou expiré' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Ce lien a expiré ou a déjà été utilisé. Refaites une demande.'),
    ).toBeInTheDocument()
    await waitFor(() => {
      expect(router.state.location.search).toBe('')
    })
  })

  it('cancels: clears the pending reset and goes home', async () => {
    localStorage.setItem(PENDING_KEY, String(Date.now()))
    renderRoutesWithAuth(authenticated, routes, '/reset-password')

    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }))

    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument()
    expect(localStorage.getItem(PENDING_KEY)).toBeNull()
    expect(updatePassword).not.toHaveBeenCalled()
  })
})
