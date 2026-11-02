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
import { t } from '@/features/i18n/i18n'

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
    return <FullPageLoader label={t('common.sessionLoading')} />
  }

  // Déjà connecté (ou vient de se connecter) : on part vers la bonne page.
  if (auth.status === 'authenticated') {
    return <PostLoginRedirect />
  }

  return (
    <AuthCard>
      <div className="flex w-full flex-col gap-1 text-center">
        <h2 className="text-lg font-semibold">{t('auth.welcome')}</h2>
        <p className="text-sm text-fg-muted">{t('auth.welcomeText')}</p>
      </div>

      <LoginPanel
        redirectTo={readFromState(location.state)}
        initialError={getAuthRedirectErrorMessage(location)}
      />

      {isDemoMode && (
        <p className="rounded-xl bg-accent/10 px-4 py-3 text-center text-xs text-fg ring-1 ring-accent/30">
          <strong className="font-semibold">{t('auth.demoTitle')}</strong>
          {t('auth.demoText')}
        </p>
      )}
    </AuthCard>
  )
}
