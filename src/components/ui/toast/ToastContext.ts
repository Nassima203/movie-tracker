/**
 * Contexte React des notifications (« toasts »). Placé dans son propre fichier
 * (et non dans ToastProvider.tsx) car un fichier de composant ne doit exporter
 * que des composants (règle react-refresh, pour le rechargement à chaud).
 */
import { createContext } from 'react'

/** Type de notification, qui détermine son icône et sa couleur. */
export type ToastTone = 'info' | 'success' | 'error'

/** Ce que les composants peuvent faire avec les notifications. */
export interface ToastApi {
  notify: (message: string, tone?: ToastTone) => void
}

/** Contexte partagé ; vaut null en dehors de `<ToastProvider>`. */
export const ToastContext = createContext<ToastApi | null>(null)
