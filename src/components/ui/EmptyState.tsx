/**
 * Message affiché quand une liste est vide (ex. : bibliothèque sans titre),
 * avec une icône et éventuellement une action pour commencer.
 */
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

/** Bloc « état vide » : icône, titre, description et action facultatives. */
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
      <Icon aria-hidden="true" className="size-8 text-accent" />
      <p className="font-semibold">{title}</p>
      {description && <p className="max-w-sm text-sm text-fg-muted">{description}</p>}
      {action}
    </div>
  )
}
