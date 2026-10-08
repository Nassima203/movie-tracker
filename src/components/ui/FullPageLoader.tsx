import { Spinner } from './Spinner'

interface FullPageLoaderProps {
  label: string
}

export function FullPageLoader({ label }: FullPageLoaderProps) {
  return (
    <div role="status" className="flex min-h-dvh items-center justify-center gap-3 text-fg-muted">
      <Spinner />
      <span>{label}</span>
    </div>
  )
}
