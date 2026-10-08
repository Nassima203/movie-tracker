import { render } from '@testing-library/react'
import type { Session } from '@supabase/supabase-js'
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router'
import { AuthContext } from '@/features/auth/AuthContext'
import type { AuthState } from '@/features/auth/types'

export const fakeSession = {
  access_token: 'token',
  refresh_token: 'refresh',
  expires_in: 3600,
  token_type: 'bearer',
  user: { id: 'user-1' },
} as unknown as Session // Test fixture: only the fields read by the app are relevant.

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
