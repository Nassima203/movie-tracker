/**
 * Passerelle d'authentification du mode démo.
 *
 * Utilisée quand Supabase n'est pas configuré : la connexion est simulée,
 * sans aucun appel réseau. N'importe quel email et mot de passe sont acceptés
 * et l'état « connecté » est simplement mémorisé dans le localStorage.
 */
import type { AuthGateway, AuthUser } from '../types'

const STORAGE_KEY = 'uwatch:demo-signed-in'

// Utilisateur fictif renvoyé quand on est « connecté » en mode démo.
const DEMO_USER: AuthUser = {
  id: 'demo-user',
  email: null,
}

function readSignedIn(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function writeSignedIn(signedIn: boolean): void {
  try {
    if (signedIn) localStorage.setItem(STORAGE_KEY, 'true')
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Démo uniquement : la session ne survivra simplement pas à un rechargement.
  }
}

/** Mode démo (Supabase non configuré) : connexion simulée, sans réseau. */
export function createDemoAuthGateway(): AuthGateway {
  // Fonctions à prévenir à chaque changement de session.
  const listeners = new Set<(user: AuthUser | null) => void>()
  let signedIn = readSignedIn()

  function emit() {
    for (const listener of listeners) listener(signedIn ? DEMO_USER : null)
  }

  return {
    onChange(listener) {
      listeners.add(listener)
      // L'état initial est envoyé de façon asynchrone (comme le ferait
      // Supabase), et seulement si l'abonné ne s'est pas désabonné entre-temps.
      queueMicrotask(() => {
        if (listeners.has(listener)) listener(signedIn ? DEMO_USER : null)
      })
      return () => {
        listeners.delete(listener)
      }
    },

    signIn() {
      signedIn = true
      writeSignedIn(true)
      emit()
      return Promise.resolve()
    },

    signUp() {
      signedIn = true
      writeSignedIn(true)
      emit()
      return Promise.resolve({ status: 'signed_in' })
    },

    // En démo, aucun email n'est envoyé : ces actions réussissent sans rien faire.
    requestPasswordReset() {
      return Promise.resolve()
    },

    updatePassword() {
      return Promise.resolve()
    },

    signOut() {
      signedIn = false
      writeSignedIn(false)
      emit()
      return Promise.resolve()
    },
  }
}
