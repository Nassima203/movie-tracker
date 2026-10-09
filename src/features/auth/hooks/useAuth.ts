/**
 * Hook d'accès à l'état de session.
 *
 * Permet à n'importe quel composant de savoir si l'utilisateur est en cours
 * de chargement, connecté ou anonyme, en lisant le contexte AuthContext.
 */
import { use } from 'react'
import { AuthContext } from '../AuthContext'
import type { AuthState } from '../types'

/**
 * Renvoie l'état de session courant.
 * Lève une erreur si le composant n'est pas placé sous <AuthProvider>, pour
 * signaler tout de suite un oubli de configuration.
 */
export function useAuth(): AuthState {
  const state = use(AuthContext)

  if (!state) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }

  return state
}
