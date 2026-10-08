import { createContext } from 'react'
import type { Theme } from './theme'

export interface ThemeApi {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const ThemeContext = createContext<ThemeApi | null>(null)
