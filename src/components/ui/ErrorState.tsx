/**
 * Message d'erreur affiché à la place d'un contenu qui n'a pas pu se charger,
 * avec un bouton « Réessayer » facultatif.
 */
import { CircleAlert } from 'lucide-react'
import { Button } from './Button'

interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

/** Bloc d'erreur ; `onRetry`, s'il est fourni, affiche le bouton « Réessayer ». */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      // Accessibilité : `role="alert"` fait lire le message immédiatement par les lecteurs d'écran.
      role="alert"
      className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface-overlay px-6 py-10 text-center backdrop-blur-md"
    >
      <CircleAlert aria-hidden="true" className="size-7 text-danger" />
      <p>{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Réessayer
        </Button>
      )}
    </div>
  )
}
