/**
 * Bouton générique de l'application, décliné en trois variantes visuelles.
 */
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-fg hover:brightness-110',
  secondary: 'border border-border bg-surface-raised text-fg hover:border-fg-muted',
  ghost: 'text-fg-muted hover:bg-surface-raised hover:text-fg',
}

/**
 * Bouton standard. Accepte tous les attributs d'un `<button>` HTML ; le type
 * vaut `button` par défaut pour ne jamais soumettre un formulaire par accident.
 */
export function Button({ variant = 'primary', type = 'button', className, ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        // Hauteur minimale de 44 px (min-h-11) : taille de cible tactile recommandée.
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  )
}
