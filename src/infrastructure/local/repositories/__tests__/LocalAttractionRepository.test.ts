import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { freshDb } from '@/test/dbTestUtils'
import type { Attraction } from '@/domain/entities/attraction'
import type { DisneyCommandDB } from '../../db'
import { seedIfEmpty } from '../../seedLoader'
import { LocalAttractionRepository, simulateAttractionTick } from '../LocalAttractionRepository'

function makeTestAttraction(overrides: Partial<Attraction> = {}): Attraction {
  return {
    id: 'test_attraction',
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

describe('LocalAttractionRepository', () => {
  let db: DisneyCommandDB
  let repository: LocalAttractionRepository

  beforeEach(async () => {
    db = await freshDb()
    await seedIfEmpty(db)
    repository = new LocalAttractionRepository(db)
  })

  afterEach(() => {
    repository.stopLiveSimulation()
  })

  it('returns only attractions for the requested park', async () => {
    const attractions = await repository.getLiveAttractions('disneyland')
    expect(attractions.length).toBe(43)
    expect(attractions.every((a) => a.park === 'disneyland')).toBe(true)
  })

  it('returns every seeded attraction across all parks via getAllAttractions', async () => {
    const attractions = await repository.getAllAttractions()
    expect(attractions).toHaveLength(66)
    const parks = new Set(attractions.map((a) => a.park))
    expect(parks.has('disneyland')).toBe(true)
    expect(parks.has('californiaAdventure')).toBe(true)
  })

  it('saveAttraction inserts a brand-new attraction', async () => {
    await repository.saveAttraction(makeTestAttraction())

    const attractions = await repository.getAllAttractions()
    expect(attractions).toHaveLength(67)
    expect(attractions.find((a) => a.id === 'test_attraction')).toMatchObject({
      name: 'Test Attraction',
      mapX: 0.5,
      mapY: 0.5,
    })
  })

  it('saveAttraction updates an existing attraction in place', async () => {
    await repository.saveAttraction(makeTestAttraction())
    await repository.saveAttraction(makeTestAttraction({ mapX: 0.75, mapY: 0.25, isOpen: false }))

    const attractions = await repository.getAllAttractions()
    expect(attractions).toHaveLength(67)
    expect(attractions.find((a) => a.id === 'test_attraction')).toMatchObject({
      mapX: 0.75,
      mapY: 0.25,
      isOpen: false,
    })
  })

  it('does not start a second interval when called twice', () => {
    repository.startLiveSimulation()
    const firstIntervalId = (repository as unknown as { intervalId: unknown }).intervalId
    repository.startLiveSimulation()
    const secondIntervalId = (repository as unknown as { intervalId: unknown }).intervalId
    expect(firstIntervalId).toBe(secondIntervalId)
  })
})

describe('simulateAttractionTick', () => {
  it('jitters wait times and clamps them within [0, 2x average]', async () => {
    const db = await freshDb()
    await seedIfEmpty(db)
    const attractions = await db.attractions.toArray()

    vi.spyOn(Math, 'random').mockReturnValue(1)
    const updated = simulateAttractionTick(attractions)

    updated.forEach((attraction, i) => {
      expect(attraction.currentWaitMinutes).toBeLessThanOrEqual(
        Math.max(attractions[i].averageWaitMinutes * 2, 15),
      )
      expect(attraction.currentWaitMinutes).toBeGreaterThanOrEqual(0)
    })

    vi.restoreAllMocks()
  })
})
