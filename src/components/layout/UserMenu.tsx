import { LogOut } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useSignOut } from '@/features/auth/hooks/useSignOut'

export function UserMenu() {
  const auth = useAuth()
  const { signOut, isPending } = useSignOut()
  const user = auth.status === 'authenticated' ? auth.user : null
  const initial = (user?.displayName ?? user?.email ?? '?').charAt(0).toUpperCase()

  return (
    <div className="flex items-center gap-1">
      {user?.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt=""
          referrerPolicy="no-referrer"
          className="size-8 rounded-full ring-1 ring-border"
        />
      ) : (
        <span
          aria-hidden="true"
          className="inline-flex size-8 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent"
        >
          {initial}
        </span>
      )}
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
