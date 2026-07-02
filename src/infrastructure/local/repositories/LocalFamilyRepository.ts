import type { FamilyRepository } from '@/application/repositories/FamilyRepository'
import { FamilySchema, type EnergyLevel, type Family } from '@/domain/entities/family'
import type { DisneyCommandDB } from '../db'

export class LocalFamilyRepository implements FamilyRepository {
  private readonly db: DisneyCommandDB

  constructor(db: DisneyCommandDB) {
    this.db = db
  }

  async getActiveFamily(): Promise<Family> {
    await this.db.ready
    const family = await this.db.families.toCollection().first()
    if (!family) throw new Error('No family found. Has the database been seeded?')
    return FamilySchema.parse(family)
  }

  async saveFamily(family: Family): Promise<void> {
    await this.db.ready
    await this.db.families.put(FamilySchema.parse(family))
  }

  async logHydration(memberId: string, at: Date): Promise<void> {
    await this.updateMember(memberId, (member) => ({
      ...member,
      lastHydrationReminder: at.toISOString(),
    }))
  }

  async logRestBreak(memberId: string, at: Date): Promise<void> {
    await this.updateMember(memberId, (member) => ({
      ...member,
      lastRestBreak: at.toISOString(),
    }))
  }

  async updateMemberEnergy(memberId: string, level: EnergyLevel): Promise<void> {
    await this.updateMember(memberId, (member) => ({ ...member, energyLevel: level }))
  }

  private async updateMember(
    memberId: string,
    update: (member: Family['members'][number]) => Family['members'][number],
  ): Promise<void> {
    const family = await this.getActiveFamily()

    const updatedFamily: Family = {
      ...family,
      members: family.members.map((member) => (member.id === memberId ? update(member) : member)),
    }

    await this.db.families.put(FamilySchema.parse(updatedFamily))
  }
}
