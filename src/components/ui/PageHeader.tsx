/**
 * En-tête standard d'une page : titre principal (h1), sous-titre facultatif et
 * emplacement à droite pour des contrôles (filtres, boutons…).
 */
import type { ReactNode } from 'react'

/** Titre de page ; les `children` s'affichent à côté (ou dessous sur mobile). */
export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-fg-muted">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}
