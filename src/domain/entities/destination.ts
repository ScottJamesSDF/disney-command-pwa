import { z } from 'zod'

/**
 * A resort grouping above `ParkId` (e.g. Walt Disney World Resort groups
 * magicKingdom/epcot/hollywoodStudios/animalKingdom). Purely a UI grouping —
 * never persisted, always derived from `ParkId` via `PARK_TO_DESTINATION`.
 */
export const DestinationIdSchema = z.enum(['waltDisneyWorld', 'disneylandResort'])
export type DestinationId = z.infer<typeof DestinationIdSchema>
