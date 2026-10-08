import { screen } from '@testing-library/react'
import { fakeSession, renderRoutesWithAuth } from '../../../../tests/utils/renderWithAuth'
import type { AuthState } from '../types'
import { ProtectedRoute } from './ProtectedRoute'

function LoginProbe() {
  return <h1>Login</h1>
}

const routes = [
  { path: '/login', Component: LoginProbe },
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
    const auth: AuthState = { status: 'authenticated', session: fakeSession }
    renderRoutesWithAuth(auth, routes, '/watchlist')

    expect(screen.getByRole('heading', { name: 'Private watchlist' })).toBeInTheDocument()
  })
})
