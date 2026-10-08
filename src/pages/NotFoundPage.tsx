import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Page introuvable</h1>
      <Link to="/" className="rounded text-accent underline-offset-4 hover:underline">
        Retour à l’accueil
      </Link>
    </main>
  )
}
