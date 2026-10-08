import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { signInWithProvider } from '../authService'
import { rememberPostLoginRedirect } from '../redirect'
import type { OAuthProvider } from '../types'
import { GitHubIcon, GoogleIcon } from './ProviderIcons'

const providers: { id: OAuthProvider; label: string; icon: ReactNode }[] = [
  { id: 'google', label: 'Continuer avec Google', icon: <GoogleIcon /> },
  { id: 'github', label: 'Continuer avec GitHub', icon: <GitHubIcon /> },
]

interface LoginPanelProps {
  redirectTo: string
  initialError: string | null
}

export function LoginPanel({ redirectTo, initialError }: LoginPanelProps) {
  const [pendingProvider, setPendingProvider] = useState<OAuthProvider | null>(null)
  const [error, setError] = useState<string | null>(initialError)

  async function handleSignIn(provider: OAuthProvider) {
    setPendingProvider(provider)
    setError(null)
    rememberPostLoginRedirect(redirectTo)

    try {
      // On success the browser navigates to the provider: keep the pending state.
      await signInWithProvider(provider)
    } catch (cause) {
      if (import.meta.env.DEV) console.error('[auth] sign-in failed', cause)
      setError('Impossible de démarrer la connexion. Veuillez réessayer.')
      setPendingProvider(null)
    }
  }

  return (
    <div className="flex w-full flex-col gap-3">
      {providers.map((provider) => (
        <Button
          key={provider.id}
          variant="secondary"
          className="w-full"
          disabled={pendingProvider !== null}
          aria-busy={pendingProvider === provider.id}
          onClick={() => void handleSignIn(provider.id)}
        >
          {pendingProvider === provider.id ? <Spinner /> : provider.icon}
          {provider.label}
        </Button>
      ))}

      {error && (
        <p role="alert" className="text-center text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
