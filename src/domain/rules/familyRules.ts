import type { EnergyLevel, Family, FamilyMember } from '@/domain/entities/family'
import { ENERGY_LEVEL_ORDER } from '@/domain/entities/family'

const HYDRATION_INTERVAL_MINUTES = 60
const REST_INTERVAL_MINUTES = 120

/**
 * Ported from Flutter `FamilyMember.needsHydration`, made pure by taking `now`
 * explicitly instead of reading `DateTime.now()` internally.
 */
export function needsHydration(member: FamilyMember, now: Date): boolean {
  const minutesSince = (now.getTime() - new Date(member.lastHydrationReminder).getTime()) / 60_000
  return minutesSince > HYDRATION_INTERVAL_MINUTES
}

/** Ported from Flutter `FamilyMember.needsRest`, same purity fix as {@link needsHydration}. */
export function needsRest(member: FamilyMember, now: Date): boolean {
  const minutesSince = (now.getTime() - new Date(member.lastRestBreak).getTime()) / 60_000
  return minutesSince > REST_INTERVAL_MINUTES
}

/** Average of member energy-level ordinals, rounded and clamped — ported from `Family.groupEnergyLevel`. */
export function groupEnergyLevel(family: Family): EnergyLevel {
  if (family.members.length === 0) return 'high'
  const total = family.members.reduce(
    (sum, member) => sum + ENERGY_LEVEL_ORDER.indexOf(member.energyLevel),
    0,
  )
  const avgIndex = Math.round(total / family.members.length)
  const clamped = Math.min(Math.max(avgIndex, 0), ENERGY_LEVEL_ORDER.length - 1)
  return ENERGY_LEVEL_ORDER[clamped]
}

/** Ported from `Family.youngest`. */
export function youngestMember(family: Family): FamilyMember | null {
  if (family.members.length === 0) return null
  return family.members.reduce((youngest, member) => (member.age < youngest.age ? member : youngest))
}

/** Ported from `Family.minHeightCm`. */
export function minHeightCm(family: Family): number {
  if (family.members.length === 0) return Infinity
  return Math.min(...family.members.map((member) => member.heightCm))
}

export function membersNeedingHydration(family: Family, now: Date): FamilyMember[] {
  return family.members.filter((member) => needsHydration(member, now))
}

export function membersNeedingRest(family: Family, now: Date): FamilyMember[] {
  return family.members.filter((member) => needsRest(member, now))
}

/** True if any family member has this attraction id in `favoriteAttractions`. */
export function isFavoritedByAnyMember(attractionId: string, family: Family): boolean {
  return family.members.some((member) => member.favoriteAttractions.includes(attractionId))
}

/** True if any family member has this attraction id in `dislikedAttractions`. */
export function isDislikedByAnyMember(attractionId: string, family: Family): boolean {
  return family.members.some((member) => member.dislikedAttractions.includes(attractionId))
}
