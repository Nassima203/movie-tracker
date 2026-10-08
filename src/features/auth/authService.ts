import { supabase } from '@/lib/supabase'
import { createDemoAuthGateway } from './gateways/demoAuthGateway'
import { createSupabaseAuthGateway } from './gateways/supabaseAuthGateway'
import type { OAuthProvider } from './types'

export const authGateway = supabase ? createSupabaseAuthGateway(supabase) : createDemoAuthGateway()

export function signInWithProvider(provider: OAuthProvider): Promise<void> {
  return authGateway.signIn(provider)
}

export function signOut(): Promise<void> {
  return authGateway.signOut()
}
