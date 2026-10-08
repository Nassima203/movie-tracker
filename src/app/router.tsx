import { createBrowserRouter } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export const router = createBrowserRouter([
  { path: '/login', Component: LoginPage },
  {
    Component: ProtectedRoute,
    children: [
      {
        Component: AppLayout,
        children: [{ index: true, Component: HomePage }],
      },
    ],
  },
  { path: '*', Component: NotFoundPage },
])
