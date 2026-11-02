/**
 * Contexte React de la langue, rempli par LanguageProvider et lu par useLanguage.
 */
import { createContext, useContext } from 'react'
import { getLanguage, setLanguage, type Language } from './i18n'

interface LanguageApi {
  language: Language
  changeLanguage: (language: Language) => void
}

// Valeur par défaut (sans LanguageProvider, par exemple dans les tests) :
// la langue est changée, mais l'application n'est pas réaffichée.
export const LanguageContext = createContext<LanguageApi>({
  language: getLanguage(),
  changeLanguage: setLanguage,
})

/** Langue actuelle et fonction pour en changer. */
export function useLanguage(): LanguageApi {
  return useContext(LanguageContext)
}
