import type { Attraction } from '@/domain/entities/attraction'
import { createNextCommand, type CommandQueue, type NextCommand } from '@/domain/entities/command'
import type { Family } from '@/domain/entities/family'
import type { DiningReservation, EntertainmentEvent, ParkDay } from '@/domain/entities/trip'
import {
  groupEnergyLevel,
  membersNeedingHydration,
  membersNeedingRest,
} from '@/domain/rules/familyRules'
import { minutesUntilDining, minutesUntilEntertainmentArrival } from '@/domain/rules/tripRules'
import { calibratePace, estimateWalkMinutes } from '@/domain/rules/paceRules'
import { scoreAttraction } from './scoring'

export interface GenerateCommandQueueInput {
  parkDay: ParkDay
  family: Family
  liveAttractions: Attraction[]
  currentTime: Date
}

const UPCOMING_QUEUE_LIMIT = 5
const HYDRATION_BREAK_EVERY_N_RIDES = 2
const HYDRATION_BREAK_DURATION_MINUTES = 7

function findLiveAttraction(liveAttractions: Attraction[], attractionId: string): Attraction | undefined {
  return liveAttractions.find((a) => a.id === attractionId)
}

function isAttractionResolved(parkDay: ParkDay, attractionId: string): boolean {
  const planned = parkDay.plannedAttractions.find((p) => p.attractionId === attractionId)
  return planned != null && (planned.isCompleted || planned.isSkipped)
}

function remainingPlannedAttractions(parkDay: ParkDay) {
  return parkDay.plannedAttractions
    .filter((p) => !p.isCompleted && !p.isSkipped)
    .sort((a, b) => a.plannedOrder - b.plannedOrder)
}

function getDelayMinutes(parkDay: ParkDay, attractionId: string): number {
  return parkDay.plannedAttractions.find((p) => p.attractionId === attractionId)?.delayMinutes ?? 0
}

/** The most recently completed attraction today, if any — "where the user actually is right now." */
function mostRecentlyCompletedAttraction(
  parkDay: ParkDay,
  liveAttractions: Attraction[],
): Attraction | null {
  const completed = parkDay.plannedAttractions
    .filter((p) => p.isCompleted && p.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
  const mostRecent = completed[0]
  if (!mostRecent) return null
  return findLiveAttraction(liveAttractions, mostRecent.attractionId) ?? null
}

function attractionSubtext(waitMinutes: number): string {
  if (waitMinutes <= 15) return "Great time to go — it's a great time to go!"
  if (waitMinutes <= 30) return 'Worth the wait.'
  if (waitMinutes <= 60) return 'Consider booking a Lightning Lane.'
  return 'Book Lightning Lane before you walk over.'
}

function effectiveWait(attraction: Attraction): { wait: number; usedLightningLane: boolean } {
  const usedLightningLane = attraction.hasLightningLane && attraction.lightningLaneAvailable
  return { wait: usedLightningLane ? 5 : attraction.currentWaitMinutes, usedLightningLane }
}

export interface AttractionCommandContext {
  /** Wherever the user is walking from — the last completed attraction, or `null` at day-start. */
  from: Attraction | null
  /** Calibrated walking pace (minutes per map-unit), or `null` to use the default speed. */
  minutesPerMapUnit: number | null
  /** Manually-added delay for this specific attraction, cascading to everything after it. */
  delayMinutes: number
}

const NO_CONTEXT: AttractionCommandContext = { from: null, minutesPerMapUnit: null, delayMinutes: 0 }

function buildAttractionCommand(
  attraction: Attraction,
  currentTime: Date,
  priority: NextCommand['priority'],
  context: AttractionCommandContext = NO_CONTEXT,
  headlinePrefix = 'Walk to',
): NextCommand {
  const { wait, usedLightningLane } = effectiveWait(attraction)
  const walkMinutes = estimateWalkMinutes(context.from, attraction, context.minutesPerMapUnit)
  const totalMinutes = walkMinutes + wait + attraction.durationMinutes + context.delayMinutes
  return {
    id: crypto.randomUUID(),
    type: 'walkToAttraction',
    priority,
    headline: `${headlinePrefix} ${attraction.name}`,
    subtext: attractionSubtext(wait),
    walkMinutes,
    waitMinutes: wait,
    durationMinutes: attraction.durationMinutes,
    estimatedCompletion: new Date(currentTime.getTime() + totalMinutes * 60_000).toISOString(),
    lightningLaneReady: usedLightningLane,
    lightningLaneNote: usedLightningLane ? 'Lightning Lane available now' : undefined,
    attraction,
    status: 'active',
    generatedAt: currentTime.toISOString(),
    metadata: {},
  }
}

function checkLightningLaneWindow(
  parkDay: ParkDay,
  liveAttractions: Attraction[],
  currentTime: Date,
): NextCommand | null {
  for (const planned of remainingPlannedAttractions(parkDay)) {
    const attraction = findLiveAttraction(liveAttractions, planned.attractionId)
    if (!attraction || !attraction.hasLightningLane || !attraction.lightningLaneReturnTime) continue

    const minutesUntilReturn =
      (new Date(attraction.lightningLaneReturnTime).getTime() - currentTime.getTime()) / 60_000

    if (minutesUntilReturn <= 0) {
      return {
        id: crypto.randomUUID(),
        type: 'rideNow',
        priority: 'critical',
        headline: 'USE LIGHTNING LANE NOW',
        subtext: `Your Lightning Lane window for ${attraction.name} is open.`,
        walkMinutes: attraction.walkFromHubMinutes,
        waitMinutes: 5,
        durationMinutes: attraction.durationMinutes,
        estimatedCompletion: new Date(
          currentTime.getTime() + (attraction.walkFromHubMinutes + 5 + attraction.durationMinutes) * 60_000,
        ).toISOString(),
        lightningLaneReady: true,
        lightningLaneNote: 'Lightning Lane window is open',
        attraction,
        status: 'active',
        generatedAt: currentTime.toISOString(),
        metadata: {},
      }
    }

    if (minutesUntilReturn <= 10) {
      const walkMinutes = Math.max(0, Math.min(15, Math.round(minutesUntilReturn)))
      return {
        id: crypto.randomUUID(),
        type: 'walkToAttraction',
        priority: 'high',
        headline: `Walk to ${attraction.name}`,
        subtext: 'Your Lightning Lane window opens soon.',
        walkMinutes,
        waitMinutes: 5,
        durationMinutes: attraction.durationMinutes,
        estimatedCompletion: new Date(
          currentTime.getTime() + (walkMinutes + 5 + attraction.durationMinutes) * 60_000,
        ).toISOString(),
        lightningLaneReady: false,
        lightningLaneNote: 'Lightning Lane window opens soon',
        attraction,
        status: 'active',
        generatedAt: currentTime.toISOString(),
        metadata: {},
      }
    }
  }
  return null
}

function checkImminentDining(parkDay: ParkDay, currentTime: Date): NextCommand | null {
  const reservations = [...parkDay.diningReservations]
    .filter((r) => !r.isCompleted)
    .sort((a, b) => new Date(a.reservationTime).getTime() - new Date(b.reservationTime).getTime())

  for (const reservation of reservations) {
    const minutesUntil = minutesUntilDining(reservation, currentTime)

    if (minutesUntil <= 0 && minutesUntil >= -15) {
      return diningCommand(reservation, currentTime, 'critical', 'DINING NOW', 0)
    }
    if (minutesUntil > 0 && minutesUntil <= 20) {
      const walkMinutes = Math.max(3, Math.min(15, Math.round(minutesUntil)))
      return diningCommand(
        reservation,
        currentTime,
        'high',
        `Walk to ${reservation.restaurantName}`,
        walkMinutes,
      )
    }
  }
  return null
}

function diningCommand(
  reservation: DiningReservation,
  currentTime: Date,
  priority: NextCommand['priority'],
  headline: string,
  walkMinutes: number,
): NextCommand {
  return createNextCommand({
    id: crypto.randomUUID(),
    type: 'headToDining',
    priority,
    headline,
    subtext: `Reservation for ${reservation.partySize} at ${reservation.restaurantName}.`,
    walkMinutes,
    locationName: reservation.restaurantName,
    generatedAt: currentTime.toISOString(),
  })
}

function checkImminentEntertainment(parkDay: ParkDay, currentTime: Date): NextCommand | null {
  const events = [...parkDay.entertainment]
    .filter((e) => !e.isCompleted)
    .sort((a, b) => new Date(a.showTime).getTime() - new Date(b.showTime).getTime())

  for (const event of events) {
    const minutesUntilArrival = minutesUntilEntertainmentArrival(event, currentTime)

    if (minutesUntilArrival >= -5 && minutesUntilArrival <= 5) {
      return entertainmentCommand(event, currentTime, `Get to ${event.name} NOW`, 0)
    }
    if (minutesUntilArrival > 5 && minutesUntilArrival <= 20) {
      const walkMinutes = Math.max(0, Math.min(20, Math.round(minutesUntilArrival)))
      return entertainmentCommand(event, currentTime, `Head to ${event.name}`, walkMinutes)
    }
  }
  return null
}

function entertainmentCommand(
  event: EntertainmentEvent,
  currentTime: Date,
  headline: string,
  walkMinutes: number,
): NextCommand {
  return createNextCommand({
    id: crypto.randomUUID(),
    type: 'watchShow',
    priority: 'high',
    headline,
    subtext: `${event.name} at ${event.location}.`,
    walkMinutes,
    durationMinutes: event.durationMinutes,
    locationName: event.location,
    generatedAt: currentTime.toISOString(),
  })
}

function checkFamilyEnergy(family: Family, currentTime: Date): NextCommand | null {
  const energy = groupEnergyLevel(family)

  if (energy === 'exhausted') {
    return createNextCommand({
      id: crypto.randomUUID(),
      type: 'restArea',
      priority: 'high',
      headline: 'Time for a break',
      subtext: 'The family is exhausted — find some shade and rest.',
      walkMinutes: 0,
      durationMinutes: 20,
      generatedAt: currentTime.toISOString(),
      metadata: { reason: 'energy_critical' },
    })
  }

  if (energy === 'low' && membersNeedingHydration(family, currentTime).length > 0) {
    return createNextCommand({
      id: crypto.randomUUID(),
      type: 'hydrationReminder',
      priority: 'normal',
      headline: 'Hydration break',
      subtext: 'Energy is low — grab some water before the next attraction.',
      walkMinutes: 0,
      durationMinutes: 5,
      generatedAt: currentTime.toISOString(),
    })
  }

  if (membersNeedingRest(family, currentTime).length > 0) {
    return createNextCommand({
      id: crypto.randomUUID(),
      type: 'restArea',
      priority: 'normal',
      headline: 'Scheduled rest break',
      subtext: 'It has been a while since the last break.',
      walkMinutes: 0,
      durationMinutes: 15,
      generatedAt: currentTime.toISOString(),
      metadata: { reason: 'scheduled_rest' },
    })
  }

  return null
}

function checkHydration(family: Family, currentTime: Date): NextCommand | null {
  const thirsty = membersNeedingHydration(family, currentTime)
  if (thirsty.length === 0) return null

  const subject = thirsty.length > 1 ? 'the family' : thirsty[0].name

  return createNextCommand({
    id: crypto.randomUUID(),
    type: 'hydrationReminder',
    priority: 'low',
    headline: 'Hydration reminder',
    subtext: `Time for ${subject} to drink some water.`,
    walkMinutes: 0,
    durationMinutes: 5,
    generatedAt: currentTime.toISOString(),
  })
}

function getNextPlannedAttraction(
  parkDay: ParkDay,
  liveAttractions: Attraction[],
  currentTime: Date,
  from: Attraction | null = null,
  minutesPerMapUnit: number | null = null,
): NextCommand | null {
  for (const planned of remainingPlannedAttractions(parkDay)) {
    const attraction = findLiveAttraction(liveAttractions, planned.attractionId)
    if (!attraction || !attraction.isOpen) continue
    return buildAttractionCommand(attraction, currentTime, 'normal', {
      from,
      minutesPerMapUnit,
      delayMinutes: getDelayMinutes(parkDay, attraction.id),
    })
  }
  return null
}

function findBestAvailableAttraction(
  liveAttractions: Attraction[],
  parkDay: ParkDay,
  family: Family,
  currentTime: Date,
  from: Attraction | null = null,
  minutesPerMapUnit: number | null = null,
): NextCommand {
  const candidates = liveAttractions.filter(
    (a) => a.isOpen && !isAttractionResolved(parkDay, a.id),
  )

  if (candidates.length === 0) {
    return createNextCommand({
      id: crypto.randomUUID(),
      type: 'celebrate',
      priority: 'normal',
      headline: 'Mission Accomplished!',
      subtext: "You've completed everything planned for today. Great job!",
      walkMinutes: 0,
      generatedAt: currentTime.toISOString(),
    })
  }

  const best = [...candidates].sort(
    (a, b) => scoreAttraction(b, family) - scoreAttraction(a, family),
  )[0]

  return buildAttractionCommand(
    best,
    currentTime,
    'normal',
    { from, minutesPerMapUnit, delayMinutes: getDelayMinutes(parkDay, best.id) },
    'Head to',
  )
}

function generateUpcomingCommands(
  parkDay: ParkDay,
  family: Family,
  liveAttractions: Attraction[],
  currentTime: Date,
  excludeAttractionId: string | undefined,
  from: Attraction | null = null,
  minutesPerMapUnit: number | null = null,
): NextCommand[] {
  const upcoming: NextCommand[] = []
  let cursor = currentTime
  let cursorFrom = from
  let rideCount = 0

  const remaining = remainingPlannedAttractions(parkDay).filter(
    (p) => p.attractionId !== excludeAttractionId,
  )

  for (const planned of remaining) {
    if (upcoming.length >= UPCOMING_QUEUE_LIMIT) break

    const attraction = findLiveAttraction(liveAttractions, planned.attractionId)
    if (!attraction || !attraction.isOpen) continue

    const command = buildAttractionCommand(attraction, cursor, 'normal', {
      from: cursorFrom,
      minutesPerMapUnit,
      delayMinutes: getDelayMinutes(parkDay, attraction.id),
    })
    upcoming.push(command)
    cursor = new Date(command.estimatedCompletion!)
    cursorFrom = attraction
    rideCount += 1

    if (rideCount % HYDRATION_BREAK_EVERY_N_RIDES === 0 && upcoming.length < UPCOMING_QUEUE_LIMIT) {
      const breakStart = cursor
      cursor = new Date(cursor.getTime() + HYDRATION_BREAK_DURATION_MINUTES * 60_000)
      upcoming.push(
        createNextCommand({
          id: crypto.randomUUID(),
          type: 'hydrationReminder',
          priority: 'low',
          headline: 'Hydration break',
          subtext: 'A quick water stop keeps everyone going.',
          walkMinutes: 0,
          durationMinutes: HYDRATION_BREAK_DURATION_MINUTES,
          estimatedCompletion: cursor.toISOString(),
          generatedAt: breakStart.toISOString(),
        }),
      )
    }
  }

  void family
  return upcoming.slice(0, UPCOMING_QUEUE_LIMIT)
}

/**
 * Determines the single best "next command" plus a projected upcoming queue,
 * following a strict priority waterfall (first match wins). Ported from
 * Flutter's `CommandEngine.generateCommandQueue`.
 */
export function generateCommandQueue(input: GenerateCommandQueueInput): CommandQueue {
  const { parkDay, family, liveAttractions, currentTime } = input

  const minutesPerMapUnit = calibratePace(parkDay, liveAttractions)
  const lastCompleted = mostRecentlyCompletedAttraction(parkDay, liveAttractions)

  const current =
    checkLightningLaneWindow(parkDay, liveAttractions, currentTime) ??
    checkImminentDining(parkDay, currentTime) ??
    checkImminentEntertainment(parkDay, currentTime) ??
    checkFamilyEnergy(family, currentTime) ??
    checkHydration(family, currentTime) ??
    getNextPlannedAttraction(parkDay, liveAttractions, currentTime, lastCompleted, minutesPerMapUnit) ??
    findBestAvailableAttraction(liveAttractions, parkDay, family, currentTime, lastCompleted, minutesPerMapUnit)

  const upcoming = generateUpcomingCommands(
    parkDay,
    family,
    liveAttractions,
    currentTime,
    current.attraction?.id,
    current.attraction ?? lastCompleted,
    minutesPerMapUnit,
  )

  return {
    current,
    upcoming,
    lastUpdated: currentTime.toISOString(),
  }
}

export {
  checkLightningLaneWindow,
  checkImminentDining,
  checkImminentEntertainment,
  checkFamilyEnergy,
  checkHydration,
  getNextPlannedAttraction,
  findBestAvailableAttraction,
  generateUpcomingCommands,
  buildAttractionCommand,
  isAttractionResolved,
}
