import { supabase } from '@/lib/supabase'
import { createDemoAuthGateway } from './gateways/demoAuthGateway'
import { createSupabaseAuthGateway } from './gateways/supabaseAuthGateway'
import type { Credentials, SignUpResult } from './types'

export const authGateway = supabase ? createSupabaseAuthGateway(supabase) : createDemoAuthGateway()

export function signIn(credentials: Credentials): Promise<void> {
  return authGateway.signIn(credentials)
}

export function signUp(credentials: Credentials): Promise<SignUpResult> {
  return authGateway.signUp(credentials)
}

export function signOut(): Promise<void> {
  return authGateway.signOut()
}
