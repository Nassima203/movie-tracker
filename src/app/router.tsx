import { createBrowserRouter } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

/** Secondary pages are code-split; the home page stays in the main bundle. */
export const router = createBrowserRouter([
  { path: '/login', Component: LoginPage },
  {
    path: '/reset-password',
    lazy: async () => ({
      Component: (await import('@/pages/ResetPasswordPage')).ResetPasswordPage,
    }),
  },
  {
    Component: ProtectedRoute,
    children: [
      {
        Component: AppLayout,
        children: [
          { index: true, Component: HomePage },
          {
            path: 'search',
            lazy: async () => ({ Component: (await import('@/pages/SearchPage')).SearchPage }),
          },
          {
            path: 'watchlist',
            lazy: async () => ({
              Component: (await import('@/pages/WatchlistPage')).WatchlistPage,
            }),
          },
          {
            path: 'in-progress',
            lazy: async () => ({
              Component: (await import('@/pages/InProgressPage')).InProgressPage,
            }),
          },
          {
            path: 'library',
            lazy: async () => ({ Component: (await import('@/pages/LibraryPage')).LibraryPage }),
          },
          {
            path: 'movie/:id',
            lazy: async () => ({
              Component: (await import('@/pages/MovieDetailPage')).MovieDetailPage,
            }),
          },
          {
            path: 'series/:id',
            lazy: async () => ({
              Component: (await import('@/pages/SeriesDetailPage')).SeriesDetailPage,
            }),
          },
        ],
      },
    ],
  },
  { path: '*', Component: NotFoundPage },
])
