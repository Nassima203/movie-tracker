import { use } from 'react'
import { ThemeContext, type ThemeApi } from './ThemeContext'

export function useTheme(): ThemeApi {
  const api = use(ThemeContext)
  if (!api) throw new Error('useTheme must be used inside <ThemeProvider>')
  return api
}
