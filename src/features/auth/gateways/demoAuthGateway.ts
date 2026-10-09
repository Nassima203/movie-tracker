import type { AuthGateway, AuthUser } from '../types'

const STORAGE_KEY = 'uwatch:demo-signed-in'

export const DEMO_USER: AuthUser = {
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
    // Demo only: the session simply won't survive a reload.
  }
}

/** Demo mode (Supabase not configured): simulated sign-in, no network. */
export function createDemoAuthGateway(): AuthGateway {
  const listeners = new Set<(user: AuthUser | null) => void>()
  let signedIn = readSignedIn()

  function emit() {
    for (const listener of listeners) listener(signedIn ? DEMO_USER : null)
  }

  return {
    onChange(listener) {
      listeners.add(listener)
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
