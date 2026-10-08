export type OAuthProvider = 'google' | 'github'

export interface AuthUser {
  id: string
  email: string | null
  displayName: string | null
  avatarUrl: string | null
}

export type AuthState =
  { status: 'loading' } | { status: 'authenticated'; user: AuthUser } | { status: 'anonymous' }

export interface AuthGateway {
  /** Subscribes to auth changes; the current state is emitted once known. */
  onChange(listener: (user: AuthUser | null) => void): () => void
  signIn(provider: OAuthProvider): Promise<void>
  signOut(): Promise<void>
}
