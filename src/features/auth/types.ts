export interface AuthUser {
  id: string
  email: string | null
  displayName: string | null
  avatarUrl: string | null
}

export type AuthState =
  { status: 'loading' } | { status: 'authenticated'; user: AuthUser } | { status: 'anonymous' }

export interface Credentials {
  email: string
  password: string
}

export type SignUpResult =
  /** Signed in right away (email confirmation disabled, or demo mode). */
  | { status: 'signed_in' }
  /** Account created: the user must click the link sent by email. */
  | { status: 'confirmation_required' }

export type AuthErrorKind =
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'email_taken'
  | 'email_invalid'
  | 'weak_password'
  | 'same_password'
  | 'not_allowed'
  | 'rate_limited'
  | 'network'
  | 'unknown'

/** Auth failure with a kind the interface can turn into a clear message. */
export class AuthFailure extends Error {
  readonly kind: AuthErrorKind

  constructor(kind: AuthErrorKind, message: string) {
    super(message)
    this.name = 'AuthFailure'
    this.kind = kind
  }
}

export interface AuthGateway {
  /** Subscribes to auth changes; the current state is emitted once known. */
  onChange(listener: (user: AuthUser | null) => void): () => void
  signIn(credentials: Credentials): Promise<void>
  signUp(credentials: Credentials): Promise<SignUpResult>
  /** Sends a reset link by email. Resolves even if no account exists (no enumeration). */
  requestPasswordReset(email: string): Promise<void>
  /** Sets a new password for the signed-in user (after following the reset link). */
  updatePassword(password: string): Promise<void>
  signOut(): Promise<void>
}
