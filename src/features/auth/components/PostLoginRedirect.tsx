import { useEffect, useState } from 'react'
import { Navigate } from 'react-router'
import { isPasswordResetPending, RESET_PASSWORD_PATH } from '../passwordRecovery'
import { clearPostLoginRedirect, readPostLoginRedirect } from '../redirect'

export function PostLoginRedirect() {
  // Read once (pure) and clear in an effect so StrictMode double renders stay consistent.
  // Back from a password reset email: choose the new password first.
  const [target] = useState(() =>
    isPasswordResetPending() ? RESET_PASSWORD_PATH : readPostLoginRedirect(),
  )

  useEffect(() => {
    clearPostLoginRedirect()
  }, [])

  return <Navigate to={target} replace />
}
