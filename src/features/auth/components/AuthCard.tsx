/**
 * Mise en page commune des écrans d'authentification (/login, /reset-password) :
 * fond animé, carte centrée, choix de la langue et logo « uwatch ».
 */
import type { ReactNode } from 'react'
import { AppBackdrop } from '@/components/layout/AppBackdrop'
import { LanguageToggle } from '@/features/i18n/LanguageToggle'
import { t } from '@/features/i18n/i18n'

/** Carte centrée avec le logo ; le contenu propre à chaque écran est passé en `children`. */
export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <AppBackdrop />
      <div className="flex w-full max-w-sm animate-fade-in flex-col items-center gap-8 rounded-3xl border border-border bg-surface-overlay px-6 py-10 shadow-2xl shadow-black/40 backdrop-blur-xl sm:px-8">
        <div className="flex w-full justify-end">
          <LanguageToggle />
        </div>
        <div className="-mt-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            u<span className="text-accent">watch</span>
          </h1>
          <p className="mt-3 text-fg-muted">{t('auth.tagline')}</p>
        </div>
        {children}
      </div>
    </main>
  )
}
