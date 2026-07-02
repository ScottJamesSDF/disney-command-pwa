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
})
