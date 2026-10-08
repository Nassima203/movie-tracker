import { use } from 'react'
import { ToastContext, type ToastApi } from './ToastContext'

export function useToast(): ToastApi {
  const api = use(ToastContext)
  if (!api) throw new Error('useToast must be used inside <ToastProvider>')
  return api
}
