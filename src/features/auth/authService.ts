import { supabase } from '@/lib/supabase'
import type { OAuthProvider } from './types'

export async function signInWithProvider(provider: OAuthProvider): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${window.location.origin}/login` },
  })

  if (error) throw error
}

/** Signs out the current device only (Supabase defaults to every device). */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: 'local' })

  if (error) throw error
}
