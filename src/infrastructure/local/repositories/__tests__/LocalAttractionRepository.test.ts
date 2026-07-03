import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { freshDb } from '@/test/dbTestUtils'
import type { DisneyCommandDB } from '../../db'
import { seedIfEmpty } from '../../seedLoader'
import { LocalAttractionRepository, simulateAttractionTick } from '../LocalAttractionRepository'

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
    const attractions = await repository.getLiveAttractions('magicKingdom')
    expect(attractions.length).toBe(16)
    expect(attractions.every((a) => a.park === 'magicKingdom')).toBe(true)
  })

  it('returns every seeded attraction across all parks via getAllAttractions', async () => {
    const attractions = await repository.getAllAttractions()
    expect(attractions).toHaveLength(74)
    const parks = new Set(attractions.map((a) => a.park))
    expect(parks.has('magicKingdom')).toBe(true)
    expect(parks.has('hollywoodStudios')).toBe(true)
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
