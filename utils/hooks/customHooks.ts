import { useRef } from "react"

/**
 * Hook to track how many times an effect has run.
 * Useful for skipping initial runs in StrictMode.
 */
export function useEffectRunCounter() {
  const effectRunCount = useRef(0)

  const increment = () => {
    effectRunCount.current += 1
    return effectRunCount.current
  }

  const reset = () => {
    effectRunCount.current = 0
  }

  // 👇 Return an object, not a function
  return {
    count: effectRunCount,
    increment,
    reset,
  }
}
