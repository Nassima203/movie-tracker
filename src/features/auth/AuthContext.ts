/**
 * Contexte React de l'authentification.
 *
 * Ce fichier crée simplement le « canal » par lequel l'état de session
 * (chargement, connecté, anonyme) est partagé avec toute l'application.
 * La valeur est fournie par <AuthProvider> et lue avec le hook useAuth().
 */
import { createContext } from 'react'
import type { AuthState } from './types'

/**
 * Contexte qui transporte l'état de session courant.
 * Vaut `null` en dehors de <AuthProvider>, ce qui permet à useAuth() de
 * détecter une mauvaise utilisation et de lever une erreur explicite.
 */
export const AuthContext = createContext<AuthState | null>(null)
