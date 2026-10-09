/**
 * Redirection juste après la connexion.
 *
 * Rendu par LoginPage dès que l'utilisateur est connecté : il l'envoie soit
 * vers la page « nouveau mot de passe » (retour d'un lien de réinitialisation),
 * soit vers la page qu'il voulait voir avant de se connecter.
 */
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router'
import { isPasswordResetPending, RESET_PASSWORD_PATH } from '../passwordRecovery'
import { clearPostLoginRedirect, readPostLoginRedirect } from '../redirect'

/** Choisit la destination après connexion et y navigue (en remplaçant l'historique). */
export function PostLoginRedirect() {
  // Lu une seule fois (de façon pure) puis effacé dans un effet, pour que les doubles
  // rendus de StrictMode restent cohérents.
  // De retour d'un email de réinitialisation : on choisit d'abord le nouveau mot de passe.
  const [target] = useState(() =>
    isPasswordResetPending() ? RESET_PASSWORD_PATH : readPostLoginRedirect(),
  )

  useEffect(() => {
    clearPostLoginRedirect()
  }, [])

  return <Navigate to={target} replace />
}
