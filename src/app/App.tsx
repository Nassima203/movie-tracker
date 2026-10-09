/**
 * Composant racine de l'application : il installe les « fournisseurs » globaux
 * (thème, cache des requêtes, authentification, notifications) puis le routeur
 * qui affiche la page correspondant à l'URL.
 */
import { RouterProvider } from 'react-router/dom'
import { AppProviders } from './providers'
import { router } from './router'

/** Point d'entrée React de uwatch, monté par `main.tsx`. */
export function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  )
}
