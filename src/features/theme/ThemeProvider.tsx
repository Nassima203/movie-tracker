/**
 * Fournisseur du thème : composant placé en haut de l'arbre React (voir
 * src/app/providers.tsx) qui garde le thème courant dans son état et le
 * partage avec toute l'application via `ThemeContext`.
 */
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { applyTheme, readStoredTheme, type Theme } from './theme'
import { ThemeContext } from './ThemeContext'

/**
 * Rend le thème accessible à tous ses enfants.
 *
 * Le thème initial est déjà appliqué avant React par le script inline de
 * index.html ; ici on se contente de relire la même valeur enregistrée.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  // On passe la fonction (et non son résultat) : React ne la lit qu'au premier rendu.
  const [theme, setThemeState] = useState<Theme>(readStoredTheme)

  // Change le thème à la fois dans la page (DOM + localStorage) et dans l'état React.
  // `useCallback` garde la même fonction d'un rendu à l'autre.
  const setTheme = useCallback((next: Theme) => {
    applyTheme(next)
    setThemeState(next)
  }, [])

  // `useMemo` évite de recréer l'objet à chaque rendu, ce qui ferait
  // re-rendre inutilement tous les composants qui lisent le contexte.
  const api = useMemo(() => ({ theme, setTheme }), [theme, setTheme])

  return <ThemeContext value={api}>{children}</ThemeContext>
}
