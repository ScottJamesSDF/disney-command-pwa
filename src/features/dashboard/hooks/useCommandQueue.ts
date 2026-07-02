import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { generateCommandQueue } from '@/application/engines/commandEngine'
import type { CommandQueue } from '@/domain/entities/command'
import type { Family } from '@/domain/entities/family'
import type { ParkDay, Trip } from '@/domain/entities/trip'
import { getTodayParkDay } from '@/domain/rules/tripRules'
import { useRepositories } from '@/shared/hooks/useRepositories'
import { useTicker } from '@/shared/hooks/useTicker'
import { queryKeys } from '@/shared/lib/queryKeys'

const ENGINE_RECOMPUTE_INTERVAL_MS = 15_000

export interface CommandQueueResult {
  queue: CommandQueue | null
  trip: Trip | null
  family: Family | null
  parkDay: ParkDay | null
  isPending: boolean
  isError: boolean
  error: unknown
}

export function useCommandQueue(): CommandQueueResult {
  const { tripRepository, familyRepository, attractionRepository } = useRepositories()
  const bucketedNow = useTicker(ENGINE_RECOMPUTE_INTERVAL_MS)

  const tripQuery = useQuery({
    queryKey: queryKeys.trip.active(),
    queryFn: () => tripRepository.getActiveTrip(),
  })

  const familyQuery = useQuery({
    queryKey: queryKeys.family.active(),
    queryFn: () => familyRepository.getActiveFamily(),
  })

  const trip = tripQuery.data ?? null
  const parkDay = useMemo(() => (trip ? getTodayParkDay(trip, bucketedNow) : null), [trip, bucketedNow])

  const attractionsQuery = useQuery({
    queryKey: queryKeys.attractions.live(parkDay?.park ?? 'magicKingdom'),
    queryFn: () => attractionRepository.getLiveAttractions(parkDay!.park),
    enabled: parkDay != null,
  })

  const family = familyQuery.data ?? null
  const liveAttractions = attractionsQuery.data ?? null

  const queue = useMemo(() => {
    if (!parkDay || !family || !liveAttractions) return null
    return generateCommandQueue({ parkDay, family, liveAttractions, currentTime: bucketedNow })
  }, [parkDay, family, liveAttractions, bucketedNow])

  const isPending =
    tripQuery.isPending ||
    familyQuery.isPending ||
    (parkDay != null && attractionsQuery.isPending)

  const isError = tripQuery.isError || familyQuery.isError || attractionsQuery.isError
  const error = tripQuery.error ?? familyQuery.error ?? attractionsQuery.error

  return { queue, trip, family, parkDay, isPending, isError, error }
}
