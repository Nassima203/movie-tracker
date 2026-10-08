import { useState } from 'react'
import { signOut } from '../authService'

/** Navigation after sign-out is driven by the `SIGNED_OUT` auth event. */
export function useSignOut() {
  const [isPending, setIsPending] = useState(false)
  const [hasError, setHasError] = useState(false)

  async function handleSignOut() {
    setIsPending(true)
    setHasError(false)

    try {
      await signOut()
    } catch (error) {
      if (import.meta.env.DEV) console.error('[auth] sign-out failed', error)
      setHasError(true)
    } finally {
      setIsPending(false)
    }
  }

  return { signOut: handleSignOut, isPending, hasError }
}
