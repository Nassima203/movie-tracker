/**
 * Petits composants de mise en page partagés par les formulaires
 * d'authentification (connexion, mot de passe oublié, nouveau mot de passe).
 */
import type { ReactNode } from 'react'

/**
 * Champ de formulaire : libellé, contrôle de saisie (passé en `children`) et
 * message d'erreur. L'erreur reçoit l'id `${id}-error`, que l'input référence
 * via aria-describedby pour que les lecteurs d'écran l'annoncent.
 */
export function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error: string | undefined
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

/** Encadré de message de succès, annoncé poliment aux lecteurs d'écran (role="status"). */
export function Notice({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      className="rounded-xl bg-success/10 px-4 py-3 text-sm ring-1 ring-success/30"
    >
      {children}
    </div>
  )
}
