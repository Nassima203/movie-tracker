/**
 * Menu utilisateur dans l'en-tête : une pastille avec l'initiale de l'email
 * et un bouton de déconnexion.
 */
import { LogOut } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useSignOut } from '@/features/auth/hooks/useSignOut'

export function UserMenu() {
  const auth = useAuth()
  const { signOut, isPending } = useSignOut()
  const email = auth.status === 'authenticated' ? auth.user.email : null
  // Première lettre de l'email (« ? » en mode démo, où il n'y a pas d'email).
  const initial = (email ?? '?').charAt(0).toUpperCase()

  return (
    <div className="flex items-center gap-1">
      <span
        aria-hidden="true"
        title={email ?? undefined}
        className="inline-flex size-8 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent"
      >
        {initial}
      </span>
      <button
        type="button"
        onClick={() => void signOut()}
        disabled={isPending}
        aria-label="Se déconnecter"
        title="Se déconnecter"
        className="inline-flex size-10 items-center justify-center rounded-full text-fg-muted transition hover:bg-surface-raised hover:text-fg disabled:opacity-60"
      >
        {isPending ? <Spinner /> : <LogOut aria-hidden="true" className="size-5" />}
      </button>
    </div>
  )
}
