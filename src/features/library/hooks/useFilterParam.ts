import { useSearchParams } from 'react-router'

/** Filter state lives in the URL: shareable, and restored by the back button. */
export function useFilterParam<T extends string>(name: string, allowed: readonly T[], fallback: T) {
  const [params, setParams] = useSearchParams()
  const raw = params.get(name)
  const value = allowed.find((option) => option === raw) ?? fallback

  function setValue(next: T) {
    setParams(
      (current) => {
        const updated = new URLSearchParams(current)
        if (next === fallback) updated.delete(name)
        else updated.set(name, next)
        return updated
      },
      { replace: true },
    )
  }

  return [value, setValue] as const
}
