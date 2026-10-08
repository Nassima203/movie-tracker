import { Moon, Sun } from 'lucide-react'
import { useTheme } from './useTheme'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={() => {
        setTheme(isDark ? 'light' : 'dark')
      }}
      aria-label={isDark ? 'Activer le mode jour' : 'Activer le mode nuit'}
      title={isDark ? 'Mode jour' : 'Mode nuit'}
      className="inline-flex size-10 items-center justify-center rounded-full text-fg-muted transition hover:bg-surface-raised hover:text-fg"
    >
      {isDark ? (
        <Sun aria-hidden="true" className="size-5" />
      ) : (
        <Moon aria-hidden="true" className="size-5" />
      )}
    </button>
  )
}
