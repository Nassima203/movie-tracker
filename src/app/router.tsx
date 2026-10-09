/**
 * Définition des routes (URL → page) de l'application.
 * Les pages de l'application sont protégées : `ProtectedRoute` redirige vers
 * la connexion si l'utilisateur n'est pas authentifié.
 */
import { createBrowserRouter } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

/**
 * Routeur de l'application.
 * Les pages secondaires sont chargées à la demande (`lazy`, découpage du code) pour
 * alléger le premier chargement ; la page d'accueil reste dans le paquet principal.
 */
export const router = createBrowserRouter([
  { path: '/login', Component: LoginPage },
  {
    path: '/reset-password',
    lazy: async () => ({
      Component: (await import('@/pages/ResetPasswordPage')).ResetPasswordPage,
    }),
  },
  // Toutes les routes ci-dessous exigent une session (sauf en mode démo).
  {
    Component: ProtectedRoute,
    children: [
      {
        // Mise en page commune (en-tête, navigation) autour de chaque page.
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
  // Toute URL inconnue affiche la page « introuvable ».
  { path: '*', Component: NotFoundPage },
])
