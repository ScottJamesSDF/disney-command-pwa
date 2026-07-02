import { useEffect, useRef } from 'react'
import type { CommandQueue } from '@/domain/entities/command'
import { notify } from '@/shared/lib/notifications'

/** Command types urgent enough to warrant a real notification. */
const NOTIFIABLE_TYPES = new Set(['rideNow', 'headToDining', 'hydrationReminder'])

/**
 * Fires a local notification the moment the current command becomes one of
 * the urgent types, and stays quiet on every subsequent 15s engine
 * recompute for as long as it's the *same* underlying situation — commands
 * get a fresh id every recompute, so dedup is keyed on
 * `type:attractionId|locationName` instead of `command.id`.
 */
export function useDashboardNotifications(queue: CommandQueue | null): void {
  const lastNotifiedKey = useRef<string | null>(null)

  useEffect(() => {
    if (!queue) return
    const { current } = queue

    if (current.priority !== 'critical' && current.priority !== 'high') {
      lastNotifiedKey.current = null
      return
    }
    if (!NOTIFIABLE_TYPES.has(current.type)) {
      lastNotifiedKey.current = null
      return
    }

    const key = `${current.type}:${current.attraction?.id ?? current.locationName ?? ''}`
    if (lastNotifiedKey.current === key) return
    lastNotifiedKey.current = key

    void notify(current.headline, {
      body: current.subtext,
      tag: 'disney-command-current',
    })
  }, [queue])
}
