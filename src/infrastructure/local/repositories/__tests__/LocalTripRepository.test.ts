import { beforeEach, describe, expect, it } from 'vitest'
import { freshDb } from '@/test/dbTestUtils'
import type { DisneyCommandDB } from '../../db'
import { seedIfEmpty } from '../../seedLoader'
import { LocalTripRepository } from '../LocalTripRepository'

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
    expect(trip?.parkDays).toHaveLength(1)
  })

  it('marks a planned attraction as completed and persists it', async () => {
    const completedAt = new Date(2026, 6, 2, 15, 30, 0, 0)
    await repository.markAttractionCompleted('parkday_today', 'haunted_mansion', completedAt)

    const trip = await repository.getActiveTrip()
    const planned = trip?.parkDays[0]?.plannedAttractions.find(
      (p) => p.attractionId === 'haunted_mansion',
    )
    expect(planned?.isCompleted).toBe(true)
    expect(planned?.completedAt).toBe(completedAt.toISOString())
  })

  it('skips a planned attraction and persists it', async () => {
    await repository.skipAttraction('parkday_today', 'space_mountain')

    const trip = await repository.getActiveTrip()
    const planned = trip?.parkDays[0]?.plannedAttractions.find(
      (p) => p.attractionId === 'space_mountain',
    )
    expect(planned?.isSkipped).toBe(true)
  })
})
