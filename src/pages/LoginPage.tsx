import { useLocation } from 'react-router'
import { AppBackdrop } from '@/components/layout/AppBackdrop'
import { FullPageLoader } from '@/components/ui/FullPageLoader'
import { LoginPanel } from '@/features/auth/components/LoginPanel'
import { PostLoginRedirect } from '@/features/auth/components/PostLoginRedirect'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getOAuthErrorMessage } from '@/features/auth/oauthError'
import { toSafeRedirectPath } from '@/features/auth/redirect'
import { isDemoMode } from '@/lib/env'

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
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <AppBackdrop />
      <div className="flex w-full max-w-sm animate-fade-in flex-col items-center gap-8 rounded-3xl border border-border bg-surface-overlay px-6 py-10 shadow-2xl shadow-black/40 backdrop-blur-xl sm:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            u<span className="text-accent">watch</span>
          </h1>
          <p className="mt-3 text-fg-muted">Ce que j’ai vu, ce que je veux voir, où j’en suis.</p>
        </div>

        <div className="flex w-full flex-col gap-1 text-center">
          <h2 className="text-lg font-semibold">Bienvenue</h2>
          <p className="text-sm text-fg-muted">Connectez-vous ou créez votre compte.</p>
        </div>

        <LoginPanel
          redirectTo={readFromState(location.state)}
          initialError={getOAuthErrorMessage(location)}
        />

        {isDemoMode && (
          <p className="rounded-xl bg-accent/10 px-4 py-3 text-center text-xs text-fg ring-1 ring-accent/30">
            <strong className="font-semibold">Mode démo</strong> : Supabase n’est pas configuré.
            N’importe quel email et mot de passe fonctionnent, et vos données restent dans ce
            navigateur.
          </p>
        )}

        <p className="text-center text-xs text-fg-muted">
          Ce produit utilise l’API TMDB mais n’est ni approuvé ni certifié par TMDB.
        </p>
      </div>
    </main>
  )
}
