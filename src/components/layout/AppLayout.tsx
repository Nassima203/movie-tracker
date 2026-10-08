import { LogOut } from 'lucide-react'
import { Link, Outlet } from 'react-router'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useSignOut } from '@/features/auth/hooks/useSignOut'

export function AppLayout() {
  const { signOut, isPending, hasError } = useSignOut()

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
          <Link to="/" className="rounded text-xl font-semibold tracking-tight">
            u<span className="text-accent">watch</span>
          </Link>

          <div className="flex items-center gap-3">
            {hasError && (
              <p role="alert" className="text-sm text-red-400">
                Échec de la déconnexion.
              </p>
            )}
            <Button variant="ghost" disabled={isPending} onClick={() => void signOut()}>
              {isPending ? <Spinner /> : <LogOut aria-hidden="true" className="size-5" />}
              <span>Se déconnecter</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
