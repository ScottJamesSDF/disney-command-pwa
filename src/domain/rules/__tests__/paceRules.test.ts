import { describe, expect, it } from 'vitest'
import type { Attraction } from '@/domain/entities/attraction'
import type { ParkDay, PlannedAttraction } from '@/domain/entities/trip'
import { calibratePace, estimateWalkMinutes, mapDistance } from '../paceRules'

function makeAttraction(overrides: Partial<Attraction> = {}): Attraction {
  return {
    id: 'attraction_1',
    name: 'Test Attraction',
    park: 'disneyland',
    area: 'fantasyland',
    type: 'ride',
    description: 'A test attraction.',
    averageWaitMinutes: 20,
    currentWaitMinutes: 20,
    hasLightningLane: false,
    lightningLaneAvailable: false,
    lightningLaneReturnTime: null,
    latitude: 33.8121,
    longitude: -117.919,
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

function makePlannedAttraction(overrides: Partial<PlannedAttraction> = {}): PlannedAttraction {
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

function makeParkDay(overrides: Partial<ParkDay> = {}): ParkDay {
  return {
    id: 'parkday_1',
    date: new Date(2026, 6, 2).toISOString(),
    parkOpenTime: { hour: 9, minute: 0 },
    parkCloseTime: { hour: 22, minute: 0 },
    arrivalTime: { hour: 9, minute: 0 },
    plannedAttractions: [],
    diningReservations: [],
    entertainment: [],
    ...overrides,
  }
}

describe('mapDistance', () => {
  it('computes Euclidean distance between two mapX/mapY positions', () => {
    const a = makeAttraction({ mapX: 0, mapY: 0 })
    const b = makeAttraction({ mapX: 3, mapY: 4 })
    expect(mapDistance(a, b)).toBe(5)
  })
})

describe('calibratePace', () => {
  it('returns null with fewer than two completed attractions', () => {
    const parkDay = makeParkDay({
      plannedAttractions: [
        makePlannedAttraction({
          attractionId: 'a',
          isCompleted: true,
          completedAt: new Date(2026, 6, 2, 10, 0).toISOString(),
        }),
      ],
    })
    const attractions = [makeAttraction({ id: 'a' })]
    expect(calibratePace(parkDay, attractions)).toBeNull()
  })

  it('derives a pace from two consecutive completed pairs (needs at least 2 samples)', () => {
    // a->b and b->c each take: wait 10 + duration 5 = 15 min at the ride, 20 min elapsed real time,
    // so 5 min of actual walking over a 0.2 map-unit distance each time -> 25 min/unit both times.
    const a = makeAttraction({ id: 'a', mapX: 0, mapY: 0 })
    const b = makeAttraction({ id: 'b', mapX: 0.2, mapY: 0, currentWaitMinutes: 10, durationMinutes: 5 })
    const c = makeAttraction({ id: 'c', mapX: 0.4, mapY: 0, currentWaitMinutes: 10, durationMinutes: 5 })
    const parkDay = makeParkDay({
      plannedAttractions: [
        makePlannedAttraction({
          attractionId: 'a',
          plannedOrder: 0,
          isCompleted: true,
          completedAt: new Date(2026, 6, 2, 10, 0).toISOString(),
        }),
        makePlannedAttraction({
          attractionId: 'b',
          plannedOrder: 1,
          isCompleted: true,
          completedAt: new Date(2026, 6, 2, 10, 20).toISOString(),
        }),
        makePlannedAttraction({
          attractionId: 'c',
          plannedOrder: 2,
          isCompleted: true,
          completedAt: new Date(2026, 6, 2, 10, 40).toISOString(),
        }),
      ],
    })
    expect(calibratePace(parkDay, [a, b, c])).toBeCloseTo(25, 5)
  })

  it('excludes a cross-park pair from the samples (only 1 valid sample left, below the minimum)', () => {
    // a->b is a valid same-park sample; b->c hops parks and must be discarded. If the cross-park
    // exclusion were broken, this would produce 2 samples and a non-null result instead of null.
    const a = makeAttraction({ id: 'a', park: 'disneyland', mapX: 0, mapY: 0 })
    const b = makeAttraction({
      id: 'b',
      park: 'disneyland',
      mapX: 0.2,
      mapY: 0,
      currentWaitMinutes: 10,
      durationMinutes: 5,
    })
    const c = makeAttraction({
      id: 'c',
      park: 'californiaAdventure',
      mapX: 0.4,
      mapY: 0,
      currentWaitMinutes: 10,
      durationMinutes: 5,
    })
    const parkDay = makeParkDay({
      plannedAttractions: [
        makePlannedAttraction({
          attractionId: 'a',
          plannedOrder: 0,
          isCompleted: true,
          completedAt: new Date(2026, 6, 2, 10, 0).toISOString(),
        }),
        makePlannedAttraction({
          attractionId: 'b',
          plannedOrder: 1,
          isCompleted: true,
          completedAt: new Date(2026, 6, 2, 10, 20).toISOString(),
        }),
        makePlannedAttraction({
          attractionId: 'c',
          plannedOrder: 2,
          isCompleted: true,
          completedAt: new Date(2026, 6, 2, 10, 40).toISOString(),
        }),
      ],
    })
    expect(calibratePace(parkDay, [a, b, c])).toBeNull()
  })
})

describe('estimateWalkMinutes', () => {
  it('falls back to walkFromHubMinutes when from is null', () => {
    const to = makeAttraction({ walkFromHubMinutes: 12 })
    expect(estimateWalkMinutes(null, to, 25)).toBe(12)
  })

  it('falls back to walkFromHubMinutes across a park-hop', () => {
    const from = makeAttraction({ park: 'disneyland' })
    const to = makeAttraction({ park: 'californiaAdventure', walkFromHubMinutes: 9 })
    expect(estimateWalkMinutes(from, to, 25)).toBe(9)
  })

  it('prefers the calibrated pace over the default speed', () => {
    const from = makeAttraction({ mapX: 0, mapY: 0 })
    const to = makeAttraction({ mapX: 0.2, mapY: 0 })
    expect(estimateWalkMinutes(from, to, 25)).toBe(5) // 0.2 * 25 = 5
    expect(estimateWalkMinutes(from, to, null)).toBe(5) // 0.2 * 26 (default) rounds to 5
  })
})
