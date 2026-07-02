import type { Attraction } from '@/domain/entities/attraction'
import type { Family } from '@/domain/entities/family'
import { minHeightCm, youngestMember } from '@/domain/rules/familyRules'

const YOUNG_CHILD_AGE_THRESHOLD = 8
const LOW_THRILL_THRESHOLD = 2
const HIGH_THRILL_THRESHOLD = 4
const SHORT_GUEST_HEIGHT_CM = 100

/**
 * Additive desirability score for an attraction given the current family,
 * ported 1:1 from Flutter's `CommandEngine._scoreAttraction`.
 */
export function scoreAttraction(attraction: Attraction, family: Family): number {
  let score = 0

  if (attraction.currentWaitMinutes <= 15) {
    score += 40
  } else if (attraction.currentWaitMinutes <= 30) {
    score += 25
  } else if (attraction.currentWaitMinutes <= 45) {
    score += 10
  }

  if (attraction.lightningLaneAvailable) {
    score += 30
  }

  if (attraction.tags.includes('must-do')) {
    score += 20
  }

  const youngest = youngestMember(family)
  if (youngest && youngest.age < YOUNG_CHILD_AGE_THRESHOLD) {
    if (attraction.thrillLevel <= LOW_THRILL_THRESHOLD) {
      score += 15
    } else if (attraction.thrillLevel >= HIGH_THRILL_THRESHOLD) {
      score -= 20
    }
  }

  if (attraction.heightRequirement != null && minHeightCm(family) < SHORT_GUEST_HEIGHT_CM) {
    score -= 30
  }

  return score
}
