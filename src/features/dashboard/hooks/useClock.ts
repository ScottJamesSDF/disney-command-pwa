import { useTicker } from '@/shared/hooks/useTicker'

/** A display-only clock that ticks every second. Never drives engine recomputation. */
export function useClock(): Date {
  return useTicker(1000)
}
