import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ParkDay, Trip } from '@/domain/entities/trip'
import { getTodayParkDay } from '@/domain/rules/tripRules'
import { buildDayTimeline, type TimelineEntry } from '@/domain/rules/timelineRules'
import { useRepositories } from '@/shared/hooks/useRepositories'
import { useTicker } from '@/shared/hooks/useTicker'
import { queryKeys } from '@/shared/lib/queryKeys'

// Timeline is a passive, read-only view — no need for the Dashboard's 15s live-ops cadence.
const TICKER_INTERVAL_MS = 60_000

export interface TimelineResult {
  entries: TimelineEntry[]
  parkDay: ParkDay | null
  now: Date
  isPending: boolean
  isError: boolean
  error: unknown
}

export function useTimeline(): TimelineResult {
  const { tripRepository, attractionRepository } = useRepositories()
  const bucketedNow = useTicker(TICKER_INTERVAL_MS)

  const tripQuery = useQuery({
    queryKey: queryKeys.trip.active(),
    queryFn: () => tripRepository.getActiveTrip(),
  })

  const trip: Trip | null = tripQuery.data ?? null
  const parkDay = useMemo(
    () => (trip ? getTodayParkDay(trip, bucketedNow) : null),
    [trip, bucketedNow],
  )

  const attractionsQuery = useQuery({
    queryKey: queryKeys.attractions.all(),
    queryFn: () => attractionRepository.getAllAttractions(),
    enabled: parkDay != null,
  })

  const entries = useMemo(() => {
    if (!parkDay || !attractionsQuery.data) return []
    return buildDayTimeline(parkDay, attractionsQuery.data, bucketedNow)
  }, [parkDay, attractionsQuery.data, bucketedNow])

  const isPending = tripQuery.isPending || (parkDay != null && attractionsQuery.isPending)
  const isError = tripQuery.isError || attractionsQuery.isError
  const error = tripQuery.error ?? attractionsQuery.error

  return { entries, parkDay, now: bucketedNow, isPending, isError, error }
}
