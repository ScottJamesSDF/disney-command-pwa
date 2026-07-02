import { useEffect, useState } from 'react'

/** Returns the current time, refreshed every `intervalMs`. */
export function useTicker(intervalMs: number): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return now
}
