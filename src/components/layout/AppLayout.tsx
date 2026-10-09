import { NavLink, Outlet, useMatch } from 'react-router'
import { Badge } from '@/components/ui/Badge'
import { SearchCombobox } from '@/features/search/components/SearchCombobox'
import { ThemeToggle } from '@/features/theme/ThemeToggle'
import { cn } from '@/lib/cn'
import { isDemoMode } from '@/lib/env'
import { AppBackdrop } from './AppBackdrop'
import { Logo } from './Logo'
import { NAV_ITEMS } from './navItems'
import { UserMenu } from './UserMenu'

export function AppLayout() {
  // The home page has its own large search box.
  const isHome = useMatch('/') !== null

  return (
    <div className="flex min-h-dvh flex-col">
      <AppBackdrop />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-fg"
      >
        Aller au contenu
      </a>

      <header className="sticky top-0 z-30 border-b border-border bg-surface-overlay backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Logo />
          {isDemoMode && (
            <Badge tone="accent" className="hidden sm:inline-flex">
              Démo
            </Badge>
          )}

          <nav aria-label="Navigation principale" className="ml-4 hidden md:block">
            <ul className="flex items-center gap-1">
              {NAV_ITEMS.filter((item) => !item.mobileOnly).map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      cn(
                        'rounded-full px-3 py-2 text-sm font-medium transition',
                        isActive ? 'bg-fg/10 text-fg' : 'text-fg-muted hover:text-fg',
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {!isHome && (
            <div className="ml-auto hidden w-full max-w-md md:block">
              <SearchCombobox variant="popover" />
            </div>
          )}

          <div className={cn('ml-auto flex items-center gap-1', !isHome && 'md:ml-0')}>
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-28 sm:px-6 md:pb-12">
        <div className="uw-content-panel -mx-2 px-2 pt-2 pb-6 sm:-mx-4 sm:px-4 md:mt-4 md:px-8 md:pt-6">
          <Outlet />
        </div>
      </main>

      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface-overlay pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      >
        <ul className="grid grid-cols-4">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition',
                    isActive ? 'text-accent' : 'text-fg-muted',
                  )
                }
              >
                <Icon aria-hidden="true" className="size-5" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
