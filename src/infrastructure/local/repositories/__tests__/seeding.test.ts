import { beforeEach, describe, expect, it } from 'vitest'
import { freshDb } from '@/test/dbTestUtils'
import type { DisneyCommandDB } from '../../db'
import { seedIfEmpty } from '../../seedLoader'

describe('seedIfEmpty', () => {
  let db: DisneyCommandDB

  beforeEach(async () => {
    db = await freshDb()
  })

  it('populates all tables on first run', async () => {
    await seedIfEmpty(db)

    expect(await db.trips.count()).toBe(1)
    expect(await db.families.count()).toBe(1)
    expect(await db.attractions.count()).toBe(8)
    expect(await db.achievements.count()).toBe(20)
  })

  it('is idempotent — re-running does not duplicate the seeded trip', async () => {
    await seedIfEmpty(db)
    await seedIfEmpty(db)

    expect(await db.trips.count()).toBe(1)
  })

  it('resolves relative-time fields against the provided `now`', async () => {
    const now = new Date(2026, 6, 2, 14, 0, 0, 0)
    await seedIfEmpty(db, now)

    const family = await db.families.toCollection().first()
    const dad = family?.members.find((m) => m.id === 'member_dad')
    expect(dad).toBeDefined()

    const minutesSinceHydration =
      (now.getTime() - new Date(dad!.lastHydrationReminder).getTime()) / 60_000
    expect(minutesSinceHydration).toBeCloseTo(30, 5)
  })
})
