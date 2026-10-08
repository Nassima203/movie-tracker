import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import { apiDevPlugin } from './server/dev/apiDevPlugin.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Expose server-only variables (e.g. TMDB_READ_ACCESS_TOKEN) to the local API
  // middleware through process.env. They are NOT added to the client bundle,
  // which only receives VITE_* variables.
  if (mode === 'development') {
    Object.assign(process.env, loadEnv(mode, process.cwd(), ''))
  }

  return {
    plugins: [react(), tailwindcss(), apiDevPlugin()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}', 'server/**/*.test.ts', 'tests/**/*.test.{ts,tsx}'],
      globals: true,
      restoreMocks: true,
    },
  }
})
