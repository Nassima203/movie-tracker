/**
 * Page de connexion (/login).
 *
 * Selon l'état de session : affiche un chargement, redirige l'utilisateur
 * déjà connecté, ou présente le panneau de connexion / inscription. C'est
 * aussi la page de retour des liens de confirmation de compte envoyés par email.
 */
import { useLocation } from 'react-router'
import { FullPageLoader } from '@/components/ui/FullPageLoader'
import { AuthCard } from '@/features/auth/components/AuthCard'
import { LoginPanel } from '@/features/auth/components/LoginPanel'
import { PostLoginRedirect } from '@/features/auth/components/PostLoginRedirect'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getAuthRedirectErrorMessage } from '@/features/auth/authRedirectError'
import { toSafeRedirectPath } from '@/features/auth/redirect'
import { isDemoMode } from '@/lib/env'

// Récupère la page d'origine transmise par ProtectedRoute dans l'état de
// navigation. Cet état est vérifié avec soin car il n'est pas typé (unknown)
// et le chemin passe par toSafeRedirectPath pour éviter toute redirection
// vers un site externe.
function readFromState(state: unknown): string {
  if (typeof state === 'object' && state !== null && 'from' in state) {
    return toSafeRedirectPath(state.from)
  }
  return '/'
}

/** Page de connexion : chargement, redirection après connexion, ou formulaire. */
export function LoginPage() {
  const auth = useAuth()
  const location = useLocation()

  if (auth.status === 'loading') {
    return <FullPageLoader label="Chargement de la session…" />
  }

  // Déjà connecté (ou vient de se connecter) : on part vers la bonne page.
  if (auth.status === 'authenticated') {
    return <PostLoginRedirect />
  }

  return (
    <AuthCard>
      <div className="flex w-full flex-col gap-1 text-center">
        <h2 className="text-lg font-semibold">Bienvenue</h2>
        <p className="text-sm text-fg-muted">Connectez-vous ou créez votre compte.</p>
      </div>

      <LoginPanel
        redirectTo={readFromState(location.state)}
        initialError={getAuthRedirectErrorMessage(location)}
      />

      {isDemoMode && (
        <p className="rounded-xl bg-accent/10 px-4 py-3 text-center text-xs text-fg ring-1 ring-accent/30">
          <strong className="font-semibold">Mode démo</strong> : Supabase n’est pas configuré.
          N’importe quel email et mot de passe fonctionnent, et vos données restent dans ce
          navigateur.
        </p>
      )}
    </AuthCard>
  )
}
