import { QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { ToastProvider } from '@/components/ui/toast/ToastProvider'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { ThemeProvider } from '@/features/theme/ThemeProvider'
import { createQueryClient } from './queryClient'

/** Drops every cached query when the user signs out (no data left behind). */
function ClearCacheOnSignOut() {
  const auth = useAuth()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (auth.status === 'anonymous') queryClient.clear()
  }, [auth.status, queryClient])

  return null
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient)

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ClearCacheOnSignOut />
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
