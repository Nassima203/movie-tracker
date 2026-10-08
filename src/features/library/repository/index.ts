import { supabase } from '@/lib/supabase'
import { createDemoLibraryRepository } from './demoRepository'
import { createSupabaseLibraryRepository } from './supabaseRepository'
import type { LibraryRepository } from './types'

export const libraryRepository: LibraryRepository = supabase
  ? createSupabaseLibraryRepository(supabase)
  : createDemoLibraryRepository()

export type { LibraryRepository, UpsertLibraryItemInput } from './types'
