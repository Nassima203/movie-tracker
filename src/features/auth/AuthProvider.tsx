/**
 * Fournisseur de session pour toute l'application.
 *
 * Ce composant enveloppe l'app (voir src/app/providers.tsx), écoute les
 * changements de session envoyés par la passerelle d'authentification
 * (Supabase ou mode démo) et publie l'état courant dans AuthContext.
 */
import { useEffect, useState, type ReactNode } from 'react'
import { authGateway } from './authService'
import { AuthContext } from './AuthContext'
import type { AuthState } from './types'

/**
 * Source de vérité de la session. L'état reste `loading` tant que la passerelle
 * n'a pas signalé la session initiale (session stockée ou code de redirection
 * OAuth) : ainsi, les pages privées ne s'affichent jamais furtivement.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  // onChange renvoie une fonction de désabonnement : en la retournant
  // directement, React l'appelle au démontage du composant.
  useEffect(
    () =>
      authGateway.onChange((user) => {
        setState(user ? { status: 'authenticated', user } : { status: 'anonymous' })
      }),
    [],
  )

  return <AuthContext value={state}>{children}</AuthContext>
}
