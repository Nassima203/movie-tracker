import { useEffect, useState, type ReactNode } from 'react'
import { authGateway } from './authService'
import { AuthContext } from './AuthContext'
import type { AuthState } from './types'

/**
 * Source of truth for the session. The state stays `loading` until the gateway
 * reports the initial session (stored session or OAuth redirect code), so
 * private pages are never flashed.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  useEffect(
    () =>
      authGateway.onChange((user) => {
        setState(user ? { status: 'authenticated', user } : { status: 'anonymous' })
      }),
    [],
  )

  return <AuthContext value={state}>{children}</AuthContext>
}
