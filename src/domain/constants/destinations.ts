import type { ParkId } from '@/domain/entities/attraction'
import type { DestinationId } from '@/domain/entities/destination'

export const DESTINATION_NAMES: Record<DestinationId, string> = {
  waltDisneyWorld: 'Walt Disney World Resort',
  disneylandResort: 'Disneyland Resort',
}

export const DESTINATION_PARKS: Record<DestinationId, ParkId[]> = {
  waltDisneyWorld: ['magicKingdom', 'epcot', 'hollywoodStudios', 'animalKingdom'],
  disneylandResort: ['disneyland', 'californiaAdventure'],
}

/** Reverse lookup, derived once at module load — every ParkId maps to exactly one Destination. */
export const PARK_TO_DESTINATION: Record<ParkId, DestinationId> = Object.fromEntries(
  (Object.entries(DESTINATION_PARKS) as [DestinationId, ParkId[]][]).flatMap(
    ([destination, parks]) => parks.map((park) => [park, destination] as const),
  ),
) as Record<ParkId, DestinationId>
