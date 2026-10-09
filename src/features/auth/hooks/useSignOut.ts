/**
 * Hook de déconnexion. La redirection vers /login n'est pas faite ici : elle
 * découle automatiquement du changement d'état de session (événement SIGNED_OUT).
 */
import { useState } from 'react'
import { signOut } from '../authService'

export function useSignOut() {
  // Vrai pendant la déconnexion : sert à désactiver le bouton et afficher un spinner.
  const [isPending, setIsPending] = useState(false)

  async function handleSignOut() {
    setIsPending(true)
    try {
      await signOut()
    } catch (error) {
      // En cas d'échec, la session reste ouverte : l'utilisatrice peut réessayer.
      if (import.meta.env.DEV) console.error('[auth] sign-out failed', error)
    } finally {
      setIsPending(false)
    }
  }

  return { signOut: handleSignOut, isPending }
}
