import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { ToastProvider } from '@/components/ui/toast/ToastProvider'
import { AuthContext } from '@/features/auth/AuthContext'
import { fakeUser } from './renderWithAuth'

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  })
}

/** Renders `ui` at `/` with an authenticated user, a fresh query cache and toasts. */
export function renderWithProviders(ui: ReactNode, queryClient = createTestQueryClient()) {
  const router = createMemoryRouter(
    [
      { path: '/', element: ui },
      { path: '/movie/:id', element: <h1>Movie page</h1> },
      { path: '/series/:id', element: <h1>Series page</h1> },
    ],
    { initialEntries: ['/'] },
  )

  const result = render(
    <QueryClientProvider client={queryClient}>
      <AuthContext value={{ status: 'authenticated', user: fakeUser }}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthContext>
    </QueryClientProvider>,
  )

  return { ...result, router, queryClient }
}
