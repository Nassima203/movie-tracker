/**
 * Hook d'accès au thème : raccourci pour lire `ThemeContext` depuis un composant.
 */
import { use } from 'react'
import { ThemeContext, type ThemeApi } from './ThemeContext'

/**
 * Renvoie le thème courant et la fonction `setTheme`.
 * Lève une erreur explicite si le composant n'est pas placé sous `<ThemeProvider>`,
 * pour repérer immédiatement l'oubli pendant le développement.
 */
export function useTheme(): ThemeApi {
  const api = use(ThemeContext)
  if (!api) throw new Error('useTheme must be used inside <ThemeProvider>')
  return api
}
