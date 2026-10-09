/**
 * Hook d'accès aux notifications depuis n'importe quel composant.
 */
import { use } from 'react'
import { ToastContext, type ToastApi } from './ToastContext'

/**
 * Renvoie l'API des notifications (`notify`). Lève une erreur claire si le
 * composant n'est pas dans un `<ToastProvider>`, plutôt que d'échouer en silence.
 */
export function useToast(): ToastApi {
  const api = use(ToastContext)
  if (!api) throw new Error('useToast must be used inside <ToastProvider>')
  return api
}
