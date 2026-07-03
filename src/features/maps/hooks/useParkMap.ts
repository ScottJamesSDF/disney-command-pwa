import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Attraction, ParkId } from '@/domain/entities/attraction'
import { getParksVisited, getTodayParkDay } from '@/domain/rules/tripRules'
import { useRepositories } from '@/shared/hooks/useRepositories'
import { queryKeys } from '@/shared/lib/queryKeys'

export interface ParkMapResult {
  /** Every park that actually has seeded attractions, in catalog order. */
  parks: ParkId[]
  attractionsByPark: Map<ParkId, Attraction[]>
  /** The parks today's plan already touches, if any — used to pick a sensible default tab. */
  defaultPark: ParkId | null
  plannedAttractionIds: Set<string>
  isPending: boolean
  isError: boolean
  error: unknown
}

export function useParkMap(): ParkMapResult {
  const { attractionRepository, tripRepository } = useRepositories()

  const attractionsQuery = useQuery({
    queryKey: queryKeys.attractions.all(),
    queryFn: () => attractionRepository.getAllAttractions(),
  })

  const tripQuery = useQuery({
    queryKey: queryKeys.trip.active(),
    queryFn: () => tripRepository.getActiveTrip(),
  })

  const attractionsByPark = useMemo(() => {
    const map = new Map<ParkId, Attraction[]>()
    for (const attraction of attractionsQuery.data ?? []) {
      const list = map.get(attraction.park)
      if (list) {
        list.push(attraction)
      } else {
        map.set(attraction.park, [attraction])
      }
    }
    return map
  }, [attractionsQuery.data])

  const parks = useMemo(() => [...attractionsByPark.keys()], [attractionsByPark])

  const plannedAttractionIds = useMemo(() => {
    const trip = tripQuery.data
    if (!trip) return new Set<string>()
    const parkDay = getTodayParkDay(trip, new Date())
    if (!parkDay) return new Set<string>()
    return new Set(parkDay.plannedAttractions.map((p) => p.attractionId))
  }, [tripQuery.data])

  const defaultPark = useMemo(() => {
    const trip = tripQuery.data
    if (!trip) return parks[0] ?? null
    const parkDay = getTodayParkDay(trip, new Date())
    if (!parkDay) return parks[0] ?? null
    const visited = getParksVisited(parkDay.plannedAttractions, attractionsQuery.data ?? [])
    return visited[0] ?? parks[0] ?? null
  }, [tripQuery.data, attractionsQuery.data, parks])

  return {
    parks,
    attractionsByPark,
    defaultPark,
    plannedAttractionIds,
    isPending: attractionsQuery.isPending,
    isError: attractionsQuery.isError,
    error: attractionsQuery.error,
  }
}
