/**
 * Redirection juste après la connexion.
 *
 * Rendu par LoginPage dès que l'utilisateur est connecté : il l'envoie vers la
 * page qu'il voulait voir avant de se connecter. (Si une réinitialisation du mot
 * de passe est en attente, ProtectedRoute l'enverra ensuite vers /reset-password.)
 */
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router'
import { clearPostLoginRedirect, readPostLoginRedirect } from '../redirect'

/** Choisit la destination après connexion et y navigue (en remplaçant l'historique). */
export function PostLoginRedirect() {
  // Lu une seule fois puis effacé dans un effet, pour que les doubles rendus de
  // StrictMode restent cohérents.
  const [target] = useState(readPostLoginRedirect)

  useEffect(() => {
    clearPostLoginRedirect()
  }, [])

  return <Navigate to={target} replace />
}
