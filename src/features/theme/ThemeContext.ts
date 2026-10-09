/**
 * Contexte React du thème.
 *
 * Il permet à n'importe quel composant de lire le thème courant et de le
 * changer, sans devoir le faire passer de parent en enfant via les props.
 * Le contexte est rempli par `ThemeProvider` et lu avec le hook `useTheme`.
 */
import { createContext } from 'react'
import type { Theme } from './theme'

/** Ce que le contexte met à disposition : le thème actuel et une fonction pour le changer. */
export interface ThemeApi {
  theme: Theme
  setTheme: (theme: Theme) => void
}

/**
 * Le contexte lui-même. Sa valeur vaut `null` en dehors d'un `ThemeProvider`,
 * ce qui permet à `useTheme` de détecter une mauvaise utilisation.
 */
export const ThemeContext = createContext<ThemeApi | null>(null)
