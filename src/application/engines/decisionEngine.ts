import { z } from 'zod'
import type { Attraction } from '@/domain/entities/attraction'
import type { NextCommand } from '@/domain/entities/command'
import type { Family } from '@/domain/entities/family'
import type { ParkDay } from '@/domain/entities/trip'
import { groupEnergyLevel } from '@/domain/rules/familyRules'
import { completedAttractions } from '@/domain/rules/tripRules'
import { timeOfDayToDate } from '@/domain/entities/trip'
import { createNextCommand } from '@/domain/entities/command'
import { buildAttractionCommand, isAttractionResolved } from './commandEngine'

/**
 * Only `rideClosed`, `waitSpike`, `familyBehindSchedule`, and `kidsTired` are
 * implemented in Phase 1. `weatherChange`, `lightningLaneUnavailable`, and
 * `restaurantClosed` are reserved for the Dining/Planner phases where there is
 * a real data source to detect them from.
 */
export const ContingencyTypeSchema = z.enum([
  'rideClosed',
  'waitSpike',
  'familyBehindSchedule',
  'kidsTired',
  'weatherChange',
  'lightningLaneUnavailable',
  'restaurantClosed',
])
export type ContingencyType = z.infer<typeof ContingencyTypeSchema>

export interface Contingency {
  type: ContingencyType
  title: string
  description: string
  alternatives: NextCommand[]
  detectedAt: string
}

export interface DetectContingenciesInput {
  currentCommand: NextCommand
  parkDay: ParkDay
  family: Family
  liveAttractions: Attraction[]
  currentTime: Date
}

const WAIT_SPIKE_MULTIPLIER = 1.5
const WAIT_SPIKE_MINIMUM_MINUTES = 30
const BEHIND_SCHEDULE_THRESHOLD_RATIO = 0.2
const RIDES_PER_HOUR_ESTIMATE = 2.5
const NEARBY_ALTERNATIVES_LIMIT = 3
const MUST_DO_ALTERNATIVES_LIMIT = 3

function findLiveAttraction(liveAttractions: Attraction[], attractionId: string): Attraction | undefined {
  return liveAttractions.find((a) => a.id === attractionId)
}

function findNearbyAlternatives(
  reference: Attraction,
  parkDay: ParkDay,
  liveAttractions: Attraction[],
  currentTime: Date,
  limit: number = NEARBY_ALTERNATIVES_LIMIT,
): NextCommand[] {
  return liveAttractions
    .filter(
      (a) =>
        a.id !== reference.id &&
        a.area === reference.area &&
        a.isOpen &&
        !isAttractionResolved(parkDay, a.id),
    )
    .sort((a, b) => a.currentWaitMinutes - b.currentWaitMinutes)
    .slice(0, limit)
    .map((a) => buildAttractionCommand(a, currentTime, 'high'))
}

function findMustDoAlternatives(
  parkDay: ParkDay,
  liveAttractions: Attraction[],
  currentTime: Date,
  limit: number = MUST_DO_ALTERNATIVES_LIMIT,
): NextCommand[] {
  return liveAttractions
    .filter((a) => a.tags.includes('must-do') && a.isOpen && !isAttractionResolved(parkDay, a.id))
    .sort((a, b) => {
      const aScore = a.lightningLaneAvailable ? -100 : a.currentWaitMinutes
      const bScore = b.lightningLaneAvailable ? -100 : b.currentWaitMinutes
      return aScore - bScore
    })
    .slice(0, limit)
    .map((a) => buildAttractionCommand(a, currentTime, 'high'))
}

function handleRideClosed(
  currentCommand: NextCommand,
  parkDay: ParkDay,
  liveAttractions: Attraction[],
  currentTime: Date,
): Contingency | null {
  if (!currentCommand.attraction) return null
  const live = findLiveAttraction(liveAttractions, currentCommand.attraction.id)
  if (!live || live.isOpen) return null

  return {
    type: 'rideClosed',
    title: `${live.name} is temporarily closed`,
    description: 'Here are some nearby alternatives while it reopens.',
    alternatives: findNearbyAlternatives(live, parkDay, liveAttractions, currentTime),
    detectedAt: currentTime.toISOString(),
  }
}

function handleWaitSpike(
  currentCommand: NextCommand,
  parkDay: ParkDay,
  liveAttractions: Attraction[],
  currentTime: Date,
): Contingency | null {
  if (!currentCommand.attraction) return null
  const live = findLiveAttraction(liveAttractions, currentCommand.attraction.id)
  if (!live || !live.isOpen) return null

  const spiked =
    live.currentWaitMinutes > live.averageWaitMinutes * WAIT_SPIKE_MULTIPLIER &&
    live.currentWaitMinutes > WAIT_SPIKE_MINIMUM_MINUTES

  if (!spiked) return null

  return {
    type: 'waitSpike',
    title: `Wait times just spiked at ${live.name}`,
    description: `The wait jumped to ${live.currentWaitMinutes} minutes. Consider one of these instead.`,
    alternatives: findNearbyAlternatives(live, parkDay, liveAttractions, currentTime),
    detectedAt: currentTime.toISOString(),
  }
}

function isBehindSchedule(parkDay: ParkDay, currentTime: Date): boolean {
  const dayDate = new Date(parkDay.date)
  const arrival = timeOfDayToDate(parkDay.arrivalTime, dayDate)
  const close = timeOfDayToDate(parkDay.parkCloseTime, dayDate)

  const totalDayMinutes = (close.getTime() - arrival.getTime()) / 60_000
  if (totalDayMinutes <= 0) return false

  const elapsedMinutes = (currentTime.getTime() - arrival.getTime()) / 60_000
  const expectedCompletionRatio = Math.min(Math.max(elapsedMinutes / totalDayMinutes, 0), 1)

  const totalPlanned = parkDay.plannedAttractions.length
  if (totalPlanned === 0) return false
  const actualCompletionRatio = completedAttractions(parkDay) / totalPlanned

  return actualCompletionRatio < expectedCompletionRatio - BEHIND_SCHEDULE_THRESHOLD_RATIO
}

function handleBehindSchedule(
  parkDay: ParkDay,
  liveAttractions: Attraction[],
  currentTime: Date,
): Contingency | null {
  if (!isBehindSchedule(parkDay, currentTime)) return null

  const dayDate = new Date(parkDay.date)
  const close = timeOfDayToDate(parkDay.parkCloseTime, dayDate)
  const hoursLeft = Math.max((close.getTime() - currentTime.getTime()) / 3_600_000, 0)
  const feasibleCount = Math.round(hoursLeft * RIDES_PER_HOUR_ESTIMATE)

  return {
    type: 'familyBehindSchedule',
    title: 'Behind schedule for today',
    description: `At this pace you can realistically fit about ${feasibleCount} more attractions. Here are the must-dos to prioritize.`,
    alternatives: findMustDoAlternatives(parkDay, liveAttractions, currentTime),
    detectedAt: currentTime.toISOString(),
  }
}

function handleExhaustedFamily(family: Family, currentTime: Date): Contingency | null {
  if (groupEnergyLevel(family) !== 'exhausted') return null

  return {
    type: 'kidsTired',
    title: 'The family is exhausted',
    description: 'Time to recharge before pushing on.',
    alternatives: [
      createNextCommand({
        id: crypto.randomUUID(),
        type: 'restArea',
        priority: 'critical',
        headline: 'Emergency rest break',
        subtext: 'Find air conditioning and seating right away.',
        walkMinutes: 0,
        durationMinutes: 30,
        generatedAt: currentTime.toISOString(),
        metadata: { reason: 'energy_critical' },
      }),
      createNextCommand({
        id: crypto.randomUUID(),
        type: 'snackBreak',
        priority: 'high',
        headline: 'Snack break',
        subtext: 'A quick snack can help restore energy.',
        walkMinutes: 0,
        durationMinutes: 20,
        generatedAt: currentTime.toISOString(),
      }),
    ],
    detectedAt: currentTime.toISOString(),
  }
}

/**
 * Independently evaluates each known contingency condition (not mutually
 * exclusive — more than one may fire at once) and returns alternatives for
 * each. Ported from Flutter's `DecisionEngine.detectContingencies`.
 */
export function detectContingencies(input: DetectContingenciesInput): Contingency[] {
  const { currentCommand, parkDay, family, liveAttractions, currentTime } = input

  const contingencies = [
    handleRideClosed(currentCommand, parkDay, liveAttractions, currentTime),
    handleWaitSpike(currentCommand, parkDay, liveAttractions, currentTime),
    handleBehindSchedule(parkDay, liveAttractions, currentTime),
    handleExhaustedFamily(family, currentTime),
  ]

  return contingencies.filter((c): c is Contingency => c != null)
}

export { isBehindSchedule, findNearbyAlternatives, findMustDoAlternatives }
