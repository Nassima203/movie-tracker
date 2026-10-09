/**
 * Garde des routes privées.
 *
 * Utilisé dans le routeur (src/app/router.tsx) pour envelopper toutes les
 * pages qui exigent une connexion. Un visiteur anonyme est renvoyé vers
 * /login, en retenant la page demandée pour l'y ramener ensuite.
 */
import { Navigate, Outlet, useLocation } from 'react-router'
import { FullPageLoader } from '@/components/ui/FullPageLoader'
import { useAuth } from '../hooks/useAuth'

/** N'affiche les routes imbriquées qu'une fois la session confirmée. */
export function ProtectedRoute() {
  const auth = useAuth()
  const location = useLocation()

  // Tant que la session n'est pas connue, on attend : ni contenu privé, ni
  // redirection prématurée vers /login.
  if (auth.status === 'loading') {
    return <FullPageLoader label="Chargement de la session…" />
  }

  if (auth.status === 'anonymous') {
    // Adresse complète demandée (chemin + paramètres + ancre), transmise à la
    // page de connexion. Elle sera revérifiée par toSafeRedirectPath.
    const from = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to="/login" replace state={{ from }} />
  }

  return <Outlet />
}
