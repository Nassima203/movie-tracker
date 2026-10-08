import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { ToastContext, type ToastApi, type ToastTone } from './ToastContext'

interface Toast {
  id: number
  message: string
  tone: ToastTone
}

const DURATION_MS = 4500
const MAX_VISIBLE = 3

const icons = { info: Info, success: CircleCheck, error: CircleAlert }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback<ToastApi['notify']>(
    (message, tone = 'info') => {
      nextId.current += 1
      const id = nextId.current
      setToasts((current) => [...current, { id, message, tone }].slice(-MAX_VISIBLE))
      setTimeout(() => {
        dismiss(id)
      }, DURATION_MS)
    },
    [dismiss],
  )

  const api = useMemo(() => ({ notify }), [notify])

  return (
    <ToastContext value={api}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6"
      >
        {toasts.map((toast) => {
          const Icon = icons[toast.tone]
          return (
            <div
              key={toast.id}
              className={cn(
                'pointer-events-auto flex w-full max-w-sm animate-toast-in items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl backdrop-blur-md',
                'border-border bg-surface-raised/95 text-fg',
              )}
            >
              <Icon
                aria-hidden="true"
                className={cn(
                  'size-5 shrink-0',
                  toast.tone === 'error' && 'text-danger',
                  toast.tone === 'success' && 'text-success',
                  toast.tone === 'info' && 'text-accent',
                )}
              />
              <p className="flex-1">{toast.message}</p>
              <button
                type="button"
                onClick={() => {
                  dismiss(toast.id)
                }}
                className="rounded p-1 text-fg-muted hover:text-fg"
                aria-label="Fermer la notification"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext>
  )
}
