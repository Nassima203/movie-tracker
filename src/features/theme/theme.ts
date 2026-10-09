/**
 * Définition des thèmes visuels (mode nuit / mode jour) et de leur persistance.
 *
 * Le thème actif est appliqué via l'attribut `data-theme` de la balise <html> :
 * le CSS (index.css) définit des couleurs différentes selon cette valeur.
 * Le choix de l'utilisateur est mémorisé dans le `localStorage` du navigateur.
 */

/**
 * Liste des thèmes disponibles.
 * Pour ajouter un thème, ajoutez-le ici et définissez ses couleurs sous
 * [data-theme='…'] dans index.css.
 */
const THEMES = ['dark', 'light'] as const

/** Nom d'un thème valide (`'dark'` ou `'light'`), déduit automatiquement de `THEMES`. */
export type Theme = (typeof THEMES)[number]

/** Thème utilisé par défaut (mode nuit) quand aucun choix n'est enregistré. */
const DEFAULT_THEME: Theme = 'dark'

/**
 * Clé sous laquelle le thème choisi est enregistré dans le `localStorage`.
 * Le script inline de index.html lit la même clé pour appliquer le thème
 * avant même le démarrage de React (évite un flash de la mauvaise couleur).
 */
export const THEME_STORAGE_KEY = 'uwatch:theme'

/**
 * Vérifie qu'une valeur quelconque est un nom de thème connu.
 * Utile car le `localStorage` peut contenir n'importe quoi (valeur modifiée à
 * la main, ancienne version de l'application…).
 */
function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value)
}

/**
 * Lit le thème enregistré ; renvoie le thème par défaut si rien de valide n'est stocké.
 */
export function readStoredTheme(): Theme {
  // `localStorage` peut lever une exception (navigation privée, stockage bloqué) :
  // on se rabat alors sur le thème par défaut.
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return isTheme(stored) ? stored : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

/**
 * Applique un thème à la page (attribut `data-theme` sur <html>) et
 * l'enregistre pour les prochaines visites.
 */
export function applyTheme(theme: Theme): void {
  document.documentElement.dataset['theme'] = theme
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Non enregistré (navigation privée) : le thème s'applique quand même pour cette session.
  }
}
