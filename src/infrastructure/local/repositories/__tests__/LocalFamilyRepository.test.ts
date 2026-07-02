import { beforeEach, describe, expect, it } from 'vitest'
import { freshDb } from '@/test/dbTestUtils'
import type { DisneyCommandDB } from '../../db'
import { seedIfEmpty } from '../../seedLoader'
import { LocalFamilyRepository } from '../LocalFamilyRepository'

describe('LocalFamilyRepository', () => {
  let db: DisneyCommandDB
  let repository: LocalFamilyRepository

  beforeEach(async () => {
    db = await freshDb()
    await seedIfEmpty(db)
    repository = new LocalFamilyRepository(db)
  })

  it('returns the seeded family', async () => {
    const family = await repository.getActiveFamily()
    expect(family.id).toBe('family_johnson')
    expect(family.members).toHaveLength(4)
  })

  it('logs hydration for a specific member and persists it', async () => {
    const at = new Date(2026, 6, 2, 15, 0, 0, 0)
    await repository.logHydration('member_jack', at)

    const family = await repository.getActiveFamily()
    const jack = family.members.find((m) => m.id === 'member_jack')
    expect(jack?.lastHydrationReminder).toBe(at.toISOString())
  })

  it('updates a member energy level and persists it', async () => {
    await repository.updateMemberEnergy('member_jack', 'exhausted')

    const family = await repository.getActiveFamily()
    const jack = family.members.find((m) => m.id === 'member_jack')
    expect(jack?.energyLevel).toBe('exhausted')
  })

  describe('saveFamily', () => {
    it('persists a new family so it becomes retrievable via getActiveFamily', async () => {
      await db.families.clear()
      await repository.saveFamily({
        id: 'family_new',
        name: 'The Smith Family',
        members: [],
        createdAt: new Date(2026, 6, 2, 12, 0, 0, 0).toISOString(),
      })

      const family = await repository.getActiveFamily()
      expect(family.id).toBe('family_new')
      expect(family.name).toBe('The Smith Family')
    })

    it('round-trips an updated members array on an existing family', async () => {
      const existing = await repository.getActiveFamily()
      await repository.saveFamily({ ...existing, members: existing.members.slice(0, 2) })

      const updated = await repository.getActiveFamily()
      expect(updated.members).toHaveLength(2)
    })
  })
})
