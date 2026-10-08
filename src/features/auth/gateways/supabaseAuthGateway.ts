import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { AuthGateway, AuthUser } from '../types'

function readMetadataString(metadata: Record<string, unknown>, key: string): string | null {
  const value = metadata[key]
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null
}

/** Provider metadata is user-controlled: only keep plain strings and https avatars. */
export function toAuthUser(user: User): AuthUser {
  const metadata: Record<string, unknown> = user.user_metadata
  const avatar = readMetadataString(metadata, 'avatar_url')

  return {
    id: user.id,
    email: user.email ?? null,
    displayName:
      readMetadataString(metadata, 'full_name') ??
      readMetadataString(metadata, 'name') ??
      readMetadataString(metadata, 'user_name'),
    avatarUrl: avatar?.startsWith('https://') ? avatar : null,
  }
}

export function createSupabaseAuthGateway(client: SupabaseClient<Database>): AuthGateway {
  return {
    onChange(listener) {
      // Synchronous callback on purpose: async callbacks are deprecated by
      // supabase-js because they can deadlock during token refresh.
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        listener(session ? toAuthUser(session.user) : null)
      })
      return () => {
        data.subscription.unsubscribe()
      }
    },

    async signIn(provider) {
      const { error } = await client.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/login` },
      })
      if (error) throw error
    },

    async signOut() {
      // Current device only (Supabase defaults to every device).
      const { error } = await client.auth.signOut({ scope: 'local' })
      if (error) throw error
    },
  }
}
