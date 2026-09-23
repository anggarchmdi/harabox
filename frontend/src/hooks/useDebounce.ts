import { useEffect, useState } from 'react'

/**
 * Custom hook to debounce any value (e.g. search input).
 * Ensures searching happens based on completed words/delays rather than every single keystroke.
 *
 * @param value The value to debounce
 * @param delay Milliseconds to delay updating the debounced value (default: 400ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default useDebounce
