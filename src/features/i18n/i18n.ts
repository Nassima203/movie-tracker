/**
 * Langue de l'interface (français ou anglais).
 *
 * La langue choisie est gardée dans une variable de ce module et dans le
 * localStorage. La fonction t() renvoie le texte d'une clé dans cette langue :
 * elle s'utilise partout, dans un composant comme dans une simple fonction.
 * Quand la langue change, LanguageProvider réaffiche toute l'application.
 */
import { en, fr, type TranslationKey } from './translations'

export type Language = 'fr' | 'en'

export const LANGUAGE_STORAGE_KEY = 'uwatch:language'

const dictionaries = { fr, en }

// Langue enregistrée lors d'une visite précédente ; le français par défaut.
function readStoredLanguage(): Language {
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY) === 'en' ? 'en' : 'fr'
  } catch {
    return 'fr'
  }
}

let currentLanguage: Language = readStoredLanguage()

/** Langue actuellement affichée. */
export function getLanguage(): Language {
  return currentLanguage
}

/**
 * Change la langue et la mémorise. Dans un composant, utiliser plutôt
 * changeLanguage (voir useLanguage) : il réaffiche aussi l'application.
 */
export function setLanguage(language: Language): void {
  currentLanguage = language
  // Indique la langue de la page aux lecteurs d'écran et aux navigateurs.
  document.documentElement.lang = language
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  } catch {
    // Sans stockage, le choix sera simplement oublié au prochain chargement.
  }
}

/**
 * Renvoie le texte de `key` dans la langue actuelle.
 * Exemple : t('media.posterAlt', { title: 'Dune' }) donne « Affiche de Dune ».
 */
export function t(key: TranslationKey, values: Record<string, string | number> = {}): string {
  let text = dictionaries[currentLanguage][key]
  for (const [name, value] of Object.entries(values)) {
    text = text.replaceAll(`{${name}}`, String(value))
  }
  return text
}
