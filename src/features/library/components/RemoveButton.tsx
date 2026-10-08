import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/cn'
import type { MediaRef } from '@/types/media'
import { useRemoveFromLibrary } from '../hooks/useLibraryActions'

/** Two-step removal: destructive (also deletes season progress), so it asks to confirm. */
export function RemoveButton({ media, title }: { media: MediaRef; title: string }) {
  const [confirming, setConfirming] = useState(false)
  const remove = useRemoveFromLibrary()

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={remove.isPending}
        onClick={() => {
          if (confirming) remove.mutate(media)
          else setConfirming(true)
        }}
        onBlur={() => {
          setConfirming(false)
        }}
        aria-label={
          confirming ? `Confirmer le retrait de ${title}` : `Retirer ${title} de la bibliothèque`
        }
        className={cn(
          'inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium transition',
          confirming ? 'bg-danger text-white' : 'text-fg-muted hover:bg-fg/10 hover:text-fg',
        )}
      >
        {remove.isPending ? (
          <Spinner className="size-4" />
        ) : (
          <Trash2 aria-hidden="true" className="size-4" />
        )}
        {confirming ? 'Confirmer le retrait' : 'Retirer'}
      </button>
    </div>
  )
}
