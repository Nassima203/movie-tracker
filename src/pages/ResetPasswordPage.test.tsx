import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider } from '@/components/ui/toast/ToastProvider'
import { updatePassword } from '@/features/auth/authService'
import { AuthFailure } from '@/features/auth/types'
import { fakeUser, renderRoutesWithAuth } from '../../tests/utils/renderWithAuth'
import { ResetPasswordPage } from './ResetPasswordPage'

vi.mock('@/features/auth/authService', () => ({ updatePassword: vi.fn() }))

const routes = [
  {
    path: '/reset-password',
    element: (
      <ToastProvider>
        <ResetPasswordPage />
      </ToastProvider>
    ),
  },
  { path: '/', element: <h1>Home</h1> },
  { path: '/login', element: <h1>Login</h1> },
]

async function choose(password: string, confirm = password) {
  await userEvent.type(screen.getByLabelText('Nouveau mot de passe'), password)
  await userEvent.type(screen.getByLabelText('Confirmer le mot de passe'), confirm)
  await userEvent.click(screen.getByRole('button', { name: 'Enregistrer le mot de passe' }))
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

  it('saves the new password, clears the pending reset and goes home', async () => {
    localStorage.setItem('uwatch:password-reset-requested-at', String(Date.now()))
    vi.mocked(updatePassword).mockResolvedValue(undefined)
    renderRoutesWithAuth({ status: 'authenticated', user: fakeUser }, routes, '/reset-password')

    await choose('nouveau123')

    expect(updatePassword).toHaveBeenCalledWith('nouveau123')
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument()
    })
    expect(localStorage.getItem('uwatch:password-reset-requested-at')).toBeNull()
  })

  it('validates the new password before calling the server', async () => {
    renderRoutesWithAuth({ status: 'authenticated', user: fakeUser }, routes, '/reset-password')

    await choose('court', 'autre')

    expect(screen.getByText('Au moins 8 caractères.')).toBeInTheDocument()
    expect(screen.getByText('Les deux mots de passe ne correspondent pas.')).toBeInTheDocument()
    expect(updatePassword).not.toHaveBeenCalled()
  })

  it('explains server refusals clearly', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.mocked(updatePassword).mockRejectedValue(new AuthFailure('same_password', 'same'))
    renderRoutesWithAuth({ status: 'authenticated', user: fakeUser }, routes, '/reset-password')

    await choose('ancien123')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Le nouveau mot de passe doit être différent de l’ancien.',
    )
  })
})
