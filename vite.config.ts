/**
 * Configuration de Vite (serveur de développement et construction du site)
 * et de Vitest (tests automatisés), qui partage la même configuration.
 */
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import { apiDevPlugin } from './server/dev/apiDevPlugin.ts'

// Documentation : https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Rend les variables réservées au serveur (ex. TMDB_READ_ACCESS_TOKEN) accessibles
  // au middleware d'API local via process.env. Elles ne sont PAS ajoutées au code
  // client, qui ne reçoit que les variables VITE_*.
  if (mode === 'development') {
    Object.assign(process.env, loadEnv(mode, process.cwd(), ''))
  }

  return {
    // apiDevPlugin sert les routes /api (dont le proxy TMDB) pendant `npm run dev`.
    plugins: [react(), tailwindcss(), apiDevPlugin()],
    resolve: {
      // Permet d'écrire `@/lib/...` au lieu de longs chemins relatifs `../../lib/...`.
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    // Réglages de Vitest : environnement navigateur simulé (jsdom) et fichiers de test.
    test: {
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}', 'server/**/*.test.ts', 'tests/**/*.test.{ts,tsx}'],
      globals: true,
      // Remet les simulations (mocks) à zéro entre chaque test pour éviter les interférences.
      clearMocks: true,
      restoreMocks: true,
    },
  }
})
