import type { Session } from '@supabase/supabase-js'

export type OAuthProvider = 'google' | 'github'

export type AuthState =
  { status: 'loading' } | { status: 'authenticated'; session: Session } | { status: 'anonymous' }
