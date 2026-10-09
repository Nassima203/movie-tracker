/**
 * Indicateur de chargement plein écran, utilisé avant que l'application soit
 * prête (ex. : pendant la vérification de la session).
 */
import { Spinner } from './Spinner'

interface FullPageLoaderProps {
  label: string
}

/** Spinner centré dans la page avec un texte explicatif. */
export function FullPageLoader({ label }: FullPageLoaderProps) {
  return (
    // Accessibilité : `role="status"` annonce poliment le texte aux lecteurs d'écran.
    <div role="status" className="flex min-h-dvh items-center justify-center gap-3 text-fg-muted">
      <Spinner />
      <span>{label}</span>
    </div>
  )
}
