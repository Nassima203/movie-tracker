/**
 * Page « introuvable » (404).
 *
 * Affichée pour une adresse inconnue, ou quand l'identifiant d'un film ou
 * d'une série dans l'URL n'est pas valide.
 */
import { Link } from 'react-router'
import { t } from '@/features/i18n/i18n'

/** Indique que la page n'existe pas et propose un lien vers l'accueil. */
export function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">{t('notFound.title')}</h1>
      <Link to="/" className="rounded text-accent underline-offset-4 hover:underline">
        {t('notFound.back')}
      </Link>
    </main>
  )
}
