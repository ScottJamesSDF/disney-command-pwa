import type { Attraction } from '@/domain/entities/attraction'
import type { Family } from '@/domain/entities/family'
import type { ParkDay, PlannedAttraction } from '@/domain/entities/trip'
import { timeOfDayToDate } from '@/domain/entities/trip'
import { isDislikedByAnyMember, isFavoritedByAnyMember } from '@/domain/rules/familyRules'
import { scoreAttraction } from '@/application/engines/scoring'
import { RIDES_PER_HOUR_ESTIMATE } from '@/application/engines/decisionEngine'

// Between scoring.ts's +30 (Lightning Lane) and +40 (low wait) bonuses — a strong nudge toward
// explicit family preferences without overriding the must-do/wait-time signal entirely.
const FAVORITE_BONUS = 35
// Sane ceiling regardless of how long the day is — no real park day realistically seats more.
const MAX_ATTRACTIONS_ABSOLUTE_CAP = 12

export interface GenerateItineraryInput {
  parkDay: ParkDay
  family: Family
  liveAttractions: Attraction[]
  /** Attraction ids already planned on other days of the same trip, excluded from this day. */
  excludedAttractionIds?: Set<string>
}

/**
 * The Planner's automated producer of `ParkDay.plannedAttractions` — ranks and selects
 * attractions for a single, already-configured park day (park/date/times already chosen). Reuses
 * the Operations Engine's `scoreAttraction` formula unmodified; the Operations Engine
 * (`commandEngine.ts`) never knows whether its input came from here or from manual entry.
 *
 * Ordering is purely by score, not geographic/area proximity — sequencing by location is deferred
 * to a future Maps/routing feature. Budget math doesn't subtract time for already-planned dining/
 * entertainment on the same day — a deliberate v1 simplification.
 */
export function generateItinerary(input: GenerateItineraryInput): PlannedAttraction[] {
  const { parkDay, family, liveAttractions, excludedAttractionIds } = input

  const candidates = liveAttractions.filter((a) => {
    if (a.type === 'dining') return false
    if (!a.isOpen) return false
    if (isDislikedByAnyMember(a.id, family)) return false
    if (excludedAttractionIds?.has(a.id)) return false
    return true
  })

  const ranked = [...candidates].sort((a, b) => {
    const scoreA = scoreAttraction(a, family) + (isFavoritedByAnyMember(a.id, family) ? FAVORITE_BONUS : 0)
    const scoreB = scoreAttraction(b, family) + (isFavoritedByAnyMember(b.id, family) ? FAVORITE_BONUS : 0)
    return scoreB - scoreA
  })

  const dayDate = new Date(parkDay.date)
  const arrival = timeOfDayToDate(parkDay.arrivalTime, dayDate)
  const close = timeOfDayToDate(parkDay.parkCloseTime, dayDate)
  const budgetMinutes = Math.max((close.getTime() - arrival.getTime()) / 60_000, 0)
  const maxAttractions = Math.min(
    Math.round((budgetMinutes / 60) * RIDES_PER_HOUR_ESTIMATE),
    MAX_ATTRACTIONS_ABSOLUTE_CAP,
  )

  const selected = ranked.slice(0, Math.max(maxAttractions, 0))

  return selected.map((a, index) => ({
    attractionId: a.id,
    attractionName: a.name,
    plannedOrder: index,
    isCompleted: false,
    completedAt: null,
    usedLightningLane: a.hasLightningLane && a.lightningLaneAvailable,
    isSkipped: false,
  }))
}
