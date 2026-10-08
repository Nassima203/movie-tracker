import { Navigate, Outlet, useLocation } from 'react-router'
import { FullPageLoader } from '@/components/ui/FullPageLoader'
import { useAuth } from '../hooks/useAuth'

/** Renders nested routes only once a session is confirmed. */
export function ProtectedRoute() {
  const auth = useAuth()
  const location = useLocation()

  if (auth.status === 'loading') {
    return <FullPageLoader label="Chargement de la session…" />
  }

  if (auth.status === 'anonymous') {
    const from = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to="/login" replace state={{ from }} />
  }

  return <Outlet />
}
