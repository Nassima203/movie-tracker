import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router'
import { AuthContext } from '@/features/auth/AuthContext'
import type { AuthState, AuthUser } from '@/features/auth/types'

export const fakeUser: AuthUser = {
  id: 'user-1',
  email: 'me@example.com',
}

export function renderRoutesWithAuth(
  auth: AuthState,
  routes: RouteObject[],
  initialEntry: string | { pathname: string; state?: unknown },
) {
  const router = createMemoryRouter(routes, { initialEntries: [initialEntry] })

  render(
    <AuthContext value={auth}>
      <RouterProvider router={router} />
    </AuthContext>,
  )

  return router
}
