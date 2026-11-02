import { screen } from '@testing-library/react'
import { fakeUser, renderRoutesWithAuth } from '../../../../tests/utils/renderWithAuth'
import type { AuthState } from '../types'
import { ProtectedRoute } from './ProtectedRoute'

function LoginProbe() {
  return <h1>Login</h1>
}

const routes = [
  { path: '/login', Component: LoginProbe },
  { path: '/reset-password', element: <h1>Reset password</h1> },
  {
    Component: ProtectedRoute,
    children: [{ path: '/watchlist', element: <h1>Private watchlist</h1> }],
  },
]

describe('ProtectedRoute', () => {
  it('shows a loader and never the private page while the session is loading', () => {
    renderRoutesWithAuth({ status: 'loading' }, routes, '/watchlist')

    expect(screen.getByRole('status')).toHaveTextContent('Chargement de la session')
    expect(screen.queryByText('Private watchlist')).not.toBeInTheDocument()
  })

  it('redirects anonymous users to /login and keeps the requested path', () => {
    const router = renderRoutesWithAuth({ status: 'anonymous' }, routes, '/watchlist?x=1')

    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.state).toEqual({ from: '/watchlist?x=1' })
  })

  it('renders the private page for authenticated users', () => {
    const auth: AuthState = { status: 'authenticated', user: fakeUser }
    renderRoutesWithAuth(auth, routes, '/watchlist')

    expect(screen.getByRole('heading', { name: 'Private watchlist' })).toBeInTheDocument()
  })

  it('sends a signed-in user with a pending password reset to /reset-password', () => {
    localStorage.setItem('uwatch:password-reset-requested-at', String(Date.now()))
    const router = renderRoutesWithAuth(
      { status: 'authenticated', user: fakeUser },
      routes,
      '/watchlist',
    )

    expect(screen.getByRole('heading', { name: 'Reset password' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/reset-password')
    localStorage.clear()
  })
})
