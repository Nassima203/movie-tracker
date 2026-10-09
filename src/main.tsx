/**
 * Point d'entrée du navigateur : charge la police et les styles globaux, puis
 * démarre l'application React dans l'élément `#root` de index.html.
 */
import '@fontsource-variable/inter'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { renderStartupError } from '@/app/startupError'
import '@/styles/index.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element #root not found in index.html')
}

/**
 * Démarre l'application. Elle est importée dynamiquement (`import()`) pour qu'un
 * échec pendant son chargement (ex. configuration d'environnement invalide)
 * affiche un écran lisible plutôt qu'une page blanche.
 */
async function start(container: HTMLElement): Promise<void> {
  try {
    const { App } = await import('@/app/App')
    createRoot(container).render(
      // StrictMode : vérifications supplémentaires de React, actives seulement en développement.
      <StrictMode>
        <App />
      </StrictMode>,
    )
  } catch (error) {
    console.error('[uwatch] startup failed', error)
    renderStartupError(container, error)
  }
}

// `void` : on lance la promesse sans l'attendre (les erreurs sont gérées dans `start`).
void start(rootElement)
