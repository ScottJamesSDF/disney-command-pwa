import { beforeEach, describe, expect, it } from 'vitest'
import { freshDb } from '@/test/dbTestUtils'
import type { Trip } from '@/domain/entities/trip'
import type { DisneyCommandDB } from '../../db'
import { seedIfEmpty } from '../../seedLoader'
import { LocalTripRepository } from '../LocalTripRepository'

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  const now = new Date(2026, 6, 2, 12, 0, 0, 0)
  return {
    id: 'trip_new',
    name: 'A New Trip',
    startDate: now.toISOString(),
    endDate: now.toISOString(),
    familyId: 'family_johnson',
    parkDays: [],
    isActive: true,
    createdAt: now.toISOString(),
    ...overrides,
  }
}

describe('LocalTripRepository', () => {
  let db: DisneyCommandDB
  let repository: LocalTripRepository

  beforeEach(async () => {
    db = await freshDb()
    await seedIfEmpty(db)
    repository = new LocalTripRepository(db)
  })

  it('returns the active trip', async () => {
    const trip = await repository.getActiveTrip()
    expect(trip?.id).toBe('trip_demo')
    expect(trip?.parkDays).toHaveLength(4)
  })

  it('marks a planned attraction as completed and persists it', async () => {
    const completedAt = new Date(2026, 6, 2, 15, 30, 0, 0)
    await repository.markAttractionCompleted('parkday_today', 'haunted_mansion_dl', completedAt)

    const trip = await repository.getActiveTrip()
    const planned = trip?.parkDays[0]?.plannedAttractions.find(
      (p) => p.attractionId === 'haunted_mansion_dl',
    )
    expect(planned?.isCompleted).toBe(true)
    expect(planned?.completedAt).toBe(completedAt.toISOString())
  })

  it('skips a planned attraction and persists it', async () => {
    await repository.skipAttraction('parkday_today', 'space_mountain_dl')

    const trip = await repository.getActiveTrip()
    const planned = trip?.parkDays[0]?.plannedAttractions.find(
      (p) => p.attractionId === 'space_mountain_dl',
    )
    expect(planned?.isSkipped).toBe(true)
  })

  it('sets a planned attraction delay and persists it', async () => {
    await repository.setAttractionDelay('parkday_today', 'haunted_mansion_dl', 15)

    const trip = await repository.getActiveTrip()
    const planned = trip?.parkDays[0]?.plannedAttractions.find(
      (p) => p.attractionId === 'haunted_mansion_dl',
    )
    expect(planned?.delayMinutes).toBe(15)
  })

  describe('saveTrip', () => {
    it('persists a new trip so it becomes retrievable via getActiveTrip', async () => {
      await repository.saveTrip(makeTrip())

      const trip = await repository.getActiveTrip()
      expect(trip?.id).toBe('trip_new')
      expect(trip?.name).toBe('A New Trip')
    })

    it('updates an existing trip in place', async () => {
      await repository.saveTrip(makeTrip())
      await repository.saveTrip(makeTrip({ name: 'Renamed Trip', notes: 'Updated notes' }))

      const trip = await repository.getActiveTrip()
      expect(trip?.id).toBe('trip_new')
      expect(trip?.name).toBe('Renamed Trip')
      expect(trip?.notes).toBe('Updated notes')
    })

    it('deactivates any other active trip when saving a new active trip', async () => {
      await repository.saveTrip(makeTrip())

      const active = await repository.getActiveTrip()
      expect(active?.id).toBe('trip_new')

      const previouslySeeded = await db.trips.get('trip_demo')
      expect(previouslySeeded?.isActive).toBe(false)
    })

    it('does not disturb the active trip when saving an inactive trip', async () => {
      await repository.saveTrip(makeTrip({ id: 'trip_draft', isActive: false }))

      const active = await repository.getActiveTrip()
      expect(active?.id).toBe('trip_demo')
    })
  })
})
