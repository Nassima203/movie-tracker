/**
 * Regroupe tous les fournisseurs de contexte React (providers) dont l'application
 * a besoin. L'ordre d'imbrication compte : un composant ne peut utiliser un
 * contexte que s'il se trouve à l'intérieur du fournisseur correspondant.
 */
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { ToastProvider } from '@/components/ui/toast/ToastProvider'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { ThemeProvider } from '@/features/theme/ThemeProvider'
import { createQueryClient } from './queryClient'

/**
 * Vide tout le cache des requêtes quand l'utilisateur se déconnecte.
 * Sécurité / confidentialité : aucune donnée du compte précédent ne doit rester
 * en mémoire (par exemple si quelqu'un d'autre se connecte ensuite sur le même appareil).
 */
function ClearCacheOnSignOut() {
  const auth = useAuth()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (auth.status === 'anonymous') queryClient.clear()
  }, [auth.status, queryClient])

  // Composant « invisible » : il n'affiche rien, il réagit seulement aux changements.
  return null
}

/**
 * Enveloppe l'application dans tous ses fournisseurs globaux :
 * thème → cache React Query → authentification → notifications (toasts).
 */
export function AppProviders({ children }: { children: ReactNode }) {
  // `useState` avec une fonction d'initialisation : le client n'est créé qu'une
  // seule fois, et non à chaque nouveau rendu (ce qui viderait le cache).
  const [queryClient] = useState(createQueryClient)

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        {/* L'authentification est sous React Query pour que ClearCacheOnSignOut accède aux deux. */}
        <AuthProvider>
          <ClearCacheOnSignOut />
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
