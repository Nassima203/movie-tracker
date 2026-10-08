import { useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { AuthContext } from './AuthContext'
import type { AuthState } from './types'

/**
 * Source of truth for the session. `onAuthStateChange` emits `INITIAL_SESSION`
 * once the stored session (or the OAuth redirect code) has been processed, so
 * the state stays `loading` until then and private pages are never flashed.
 *
 * The callback is synchronous on purpose: async callbacks are deprecated by
 * supabase-js because they can deadlock during token refresh.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(session ? { status: 'authenticated', session } : { status: 'anonymous' })
    })

    return () => {
      data.subscription.unsubscribe()
    }
  }, [])

  return <AuthContext value={state}>{children}</AuthContext>
}
