/**
 * Logo texte « uwatch » de l'en-tête, qui sert aussi de lien vers l'accueil.
 */
import { Link } from 'react-router'
import { cn } from '@/lib/cn'

/** Logo cliquable menant à la page d'accueil. */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      // Accessibilité : le libellé précise la destination du lien, pas seulement le nom.
      aria-label="uwatch, accueil"
      className={cn('rounded-md text-xl font-bold tracking-tight', className)}
    >
      u<span className="text-accent">watch</span>
    </Link>
  )
}
