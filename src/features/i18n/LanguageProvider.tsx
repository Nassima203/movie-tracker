/**
 * Fournisseur de la langue : garde la langue choisie et réaffiche toute
 * l'application quand elle change, pour que chaque texte passe par t() à nouveau.
 */
import { useQueryClient } from '@tanstack/react-query'
import { Fragment, useState, type ReactNode } from 'react'
import { getLanguage, setLanguage, type Language } from './i18n'
import { LanguageContext } from './LanguageContext'

/** Rend la langue et sa fonction de changement accessibles à tous ses enfants. */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getLanguage)
  const queryClient = useQueryClient()

  function changeLanguage(next: Language) {
    setLanguage(next)
    // Les titres et résumés TMDB déjà chargés sont dans l'ancienne langue : on les oublie.
    queryClient.removeQueries({ queryKey: ['catalog'] })
    setLanguageState(next)
  }

  return (
    <LanguageContext value={{ language, changeLanguage }}>
      {/* Changer la clé recrée les pages : tous les textes sont relus dans la nouvelle langue. */}
      <Fragment key={language}>{children}</Fragment>
    </LanguageContext>
  )
}
