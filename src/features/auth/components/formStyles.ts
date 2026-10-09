/**
 * Styles partagés des champs de saisie des formulaires d'authentification.
 * Placé dans un fichier .ts séparé car un fichier de composants .tsx ne doit
 * exporter que des composants (règle react-refresh).
 */
import { cn } from '@/lib/cn'

/** Classes CSS d'un champ texte ; bordure rouge si le champ est en erreur. */
export function inputClass(hasError: boolean): string {
  return cn(
    'h-12 w-full rounded-xl border bg-surface px-4 text-base text-fg outline-none transition placeholder:text-fg-muted',
    'focus-visible:border-accent focus-visible:outline-none',
    hasError ? 'border-danger' : 'border-border',
  )
}
