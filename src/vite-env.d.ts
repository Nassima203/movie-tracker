/// <reference types="vite/client" />

/*
 * Déclarations de types pour Vite : décrit les variables d'environnement
 * disponibles via `import.meta.env`, afin que TypeScript les connaisse.
 */

/** Variables `VITE_*` publiques (intégrées au code client, donc jamais secrètes). Optionnelles : absentes en mode démo. */
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
