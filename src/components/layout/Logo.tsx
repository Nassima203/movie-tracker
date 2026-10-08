import { Link } from 'react-router'
import { cn } from '@/lib/cn'

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      aria-label="uwatch, accueil"
      className={cn('rounded-md text-xl font-bold tracking-tight', className)}
    >
      u<span className="text-accent">watch</span>
    </Link>
  )
}
