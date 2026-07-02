import type { Attraction } from '@/domain/entities/attraction'
import type { EnergyLevel, Family, FamilyMember } from '@/domain/entities/family'
import type {
  DiningReservation,
  EntertainmentEvent,
  ParkDay,
  PlannedAttraction,
} from '@/domain/entities/trip'

// Constructed from local components (not a 'Z' UTC string) so it lines up
// predictably with `TimeOfDay`-based fields (parkOpenTime/arrivalTime/etc.),
// which are resolved via `Date.setHours` in local time — regardless of the
// timezone the test runner happens to execute in.
export const CURRENT_TIME = new Date(2026, 6, 2, 14, 0, 0, 0)

let idCounter = 0
function nextId(prefix: string): string {
  idCounter += 1
  return `${prefix}_${idCounter}`
}

export function isoMinutesFrom(base: Date, minutes: number): string {
  return new Date(base.getTime() + minutes * 60_000).toISOString()
}

export function isoHoursFrom(base: Date, hours: number): string {
  return new Date(base.getTime() + hours * 3_600_000).toISOString()
}

export function makeAttraction(overrides: Partial<Attraction> = {}): Attraction {
  return {
    id: nextId('attraction'),
    name: 'Test Attraction',
    park: 'magicKingdom',
    area: 'fantasyland',
    type: 'ride',
    description: 'A test attraction.',
    averageWaitMinutes: 30,
    currentWaitMinutes: 20,
    hasLightningLane: false,
    lightningLaneAvailable: false,
    lightningLaneReturnTime: null,
    latitude: 28.4177,
    longitude: -81.5812,
    mapX: 0.5,
    mapY: 0.5,
    durationMinutes: 5,
    isOpen: true,
    tags: [],
    thrillLevel: 2,
    heightRequirement: null,
    isGalaxysEdge: false,
    photoTip: null,
    walkFromHubMinutes: 5,
    ...overrides,
  }
}

export function makeFamilyMember(overrides: Partial<FamilyMember> = {}): FamilyMember {
  return {
    id: nextId('member'),
    name: 'Test Member',
    age: 30,
    heightCm: 170,
    ageGroup: 'adult',
    energyLevel: 'high',
    favoriteAttractions: [],
    dislikedAttractions: [],
    needsStroller: false,
    stepsToday: 1000,
    ridesCompleted: 0,
    lastHydrationReminder: isoMinutesFrom(CURRENT_TIME, -10),
    lastRestBreak: isoHoursFrom(CURRENT_TIME, -1),
    ...overrides,
  }
}

export function makeFamily(members: FamilyMember[] = [makeFamilyMember()]): Family {
  return {
    id: nextId('family'),
    name: 'Test Family',
    members,
    createdAt: isoHoursFrom(CURRENT_TIME, -24),
  }
}

export function makeFamilyWithEnergy(energyLevel: EnergyLevel): Family {
  return makeFamily([makeFamilyMember({ energyLevel })])
}

export function makePlannedAttraction(overrides: Partial<PlannedAttraction> = {}): PlannedAttraction {
  return {
    attractionId: 'attraction_1',
    attractionName: 'Test Attraction',
    plannedOrder: 0,
    isCompleted: false,
    completedAt: null,
    usedLightningLane: false,
    isSkipped: false,
    ...overrides,
  }
}

export function makeDiningReservation(overrides: Partial<DiningReservation> = {}): DiningReservation {
  return {
    id: nextId('dining'),
    restaurantName: 'Test Restaurant',
    restaurantId: 'test_restaurant',
    reservationTime: isoMinutesFrom(CURRENT_TIME, 60),
    partySize: 4,
    isConfirmed: true,
    isMobileOrder: false,
    isCompleted: false,
    ...overrides,
  }
}

export function makeEntertainmentEvent(overrides: Partial<EntertainmentEvent> = {}): EntertainmentEvent {
  return {
    id: nextId('entertainment'),
    name: 'Test Show',
    showTime: isoMinutesFrom(CURRENT_TIME, 60),
    location: 'Test Location',
    durationMinutes: 15,
    recommendedArrivalMinutesBefore: 20,
    isCompleted: false,
    ...overrides,
  }
}

export function makeParkDay(overrides: Partial<ParkDay> = {}): ParkDay {
  return {
    id: nextId('parkday'),
    date: CURRENT_TIME.toISOString(),
    park: 'magicKingdom',
    parkOpenTime: { hour: 9, minute: 0 },
    parkCloseTime: { hour: 22, minute: 0 },
    arrivalTime: { hour: 9, minute: 0 },
    plannedAttractions: [],
    diningReservations: [],
    entertainment: [],
    hasParkHopper: false,
    ...overrides,
  }
}
