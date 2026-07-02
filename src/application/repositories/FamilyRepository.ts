import type { EnergyLevel, Family } from '@/domain/entities/family'

export interface FamilyRepository {
  getActiveFamily(): Promise<Family>
  /** Upserts the family (whole-document replace, including its `members` array). */
  saveFamily(family: Family): Promise<void>
  logHydration(memberId: string, at: Date): Promise<void>
  logRestBreak(memberId: string, at: Date): Promise<void>
  updateMemberEnergy(memberId: string, level: EnergyLevel): Promise<void>
}
