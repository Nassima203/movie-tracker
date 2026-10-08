import { Skeleton } from '@/components/ui/Skeleton'

export function DetailSkeleton() {
  return (
    <div
      role="status"
      aria-label="Chargement"
      className="flex flex-col gap-6 pt-6 sm:flex-row sm:items-end"
    >
      <Skeleton className="aspect-[2/3] w-40 sm:w-56" />
      <div className="flex flex-1 flex-col gap-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-4 w-full max-w-xl" />
        <Skeleton className="h-4 w-5/6 max-w-xl" />
      </div>
    </div>
  )
}
