/**
 * Point d'entrée du dépôt de la bibliothèque : choisit l'implémentation au
 * démarrage. Si Supabase est configuré, on l'utilise ; sinon l'application
 * fonctionne en mode démo avec le localStorage du navigateur.
 */
import { supabase } from '@/lib/supabase'
import { createDemoLibraryRepository } from './demoRepository'
import { createSupabaseLibraryRepository } from './supabaseRepository'
import type { LibraryRepository } from './types'

/** Dépôt unique partagé par toute l'application (Supabase ou démo). */
export const libraryRepository: LibraryRepository = supabase
  ? createSupabaseLibraryRepository(supabase)
  : createDemoLibraryRepository()
