import { useEffect, useState } from 'react'
import { Navigate } from 'react-router'
import { clearPostLoginRedirect, readPostLoginRedirect } from '../redirect'

export function PostLoginRedirect() {
  // Read once (pure) and clear in an effect so StrictMode double renders stay consistent.
  const [target] = useState(readPostLoginRedirect)

  useEffect(() => {
    clearPostLoginRedirect()
  }, [])

  return <Navigate to={target} replace />
}
