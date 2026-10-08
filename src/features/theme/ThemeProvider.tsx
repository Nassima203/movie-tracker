import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { applyTheme, readStoredTheme, type Theme } from './theme'
import { ThemeContext } from './ThemeContext'

/** The initial theme is applied before React by the inline script in index.html. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme)

  const setTheme = useCallback((next: Theme) => {
    applyTheme(next)
    setThemeState(next)
  }, [])

  const api = useMemo(() => ({ theme, setTheme }), [theme, setTheme])

  return <ThemeContext value={api}>{children}</ThemeContext>
}
