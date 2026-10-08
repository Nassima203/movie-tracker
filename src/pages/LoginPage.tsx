import { useLocation } from 'react-router'
import { FullPageLoader } from '@/components/ui/FullPageLoader'
import { LoginPanel } from '@/features/auth/components/LoginPanel'
import { PostLoginRedirect } from '@/features/auth/components/PostLoginRedirect'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getOAuthErrorMessage } from '@/features/auth/oauthError'
import { toSafeRedirectPath } from '@/features/auth/redirect'

function readFromState(state: unknown): string {
  if (typeof state === 'object' && state !== null && 'from' in state) {
    return toSafeRedirectPath(state.from)
  }
  return '/'
}

export function LoginPage() {
  const auth = useAuth()
  const location = useLocation()

  if (auth.status === 'loading') {
    return <FullPageLoader label="Chargement de la session…" />
  }

  if (auth.status === 'authenticated') {
    return <PostLoginRedirect />
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col items-center justify-center gap-8 px-4">
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight">
          u<span className="text-accent">watch</span>
        </h1>
        <p className="mt-2 text-fg-muted">Ce que j’ai vu, ce que je veux voir, où j’en suis.</p>
      </div>

      <LoginPanel
        redirectTo={readFromState(location.state)}
        initialError={getOAuthErrorMessage(location)}
      />

      <p className="text-center text-xs text-fg-muted">
        Ce produit utilise l’API TMDB mais n’est ni approuvé ni certifié par TMDB.
      </p>
    </main>
  )
}
