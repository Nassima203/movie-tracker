import { use } from 'react'
import { AuthContext } from '../AuthContext'
import type { AuthState } from '../types'

export function useAuth(): AuthState {
  const state = use(AuthContext)

  if (!state) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }

  return state
}
