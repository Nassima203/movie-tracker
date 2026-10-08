import { useEffect, useState } from 'react'

/**
 * Returns `value` once it has stopped changing for `delayMs`.
 * Each change resets the timer; the timer is cleared on unmount, so no state
 * update can happen after the component is gone.
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value)
    }, delayMs)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delayMs])

  return debounced
}
