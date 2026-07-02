import type { AchievementRepository } from '@/application/repositories/AchievementRepository'
import { AchievementSchema, type Achievement } from '@/domain/entities/achievement'
import type { DisneyCommandDB } from '../db'

export class LocalAchievementRepository implements AchievementRepository {
  private readonly db: DisneyCommandDB

  constructor(db: DisneyCommandDB) {
    this.db = db
  }

  async getAll(): Promise<Achievement[]> {
    await this.db.ready
    const achievements = await this.db.achievements.toArray()
    return achievements.map((a) => AchievementSchema.parse(a))
  }

  async unlock(id: string, at: Date): Promise<void> {
    await this.update(id, (achievement) => ({
      ...achievement,
      isUnlocked: true,
      unlockedAt: at.toISOString(),
    }))
  }

  async updateProgress(id: string, progress: number): Promise<void> {
    await this.update(id, (achievement) => ({ ...achievement, progress }))
  }

  private async update(
    id: string,
    update: (achievement: Achievement) => Achievement,
  ): Promise<void> {
    await this.db.ready
    const achievement = await this.db.achievements.get(id)
    if (!achievement) throw new Error(`Achievement not found: ${id}`)
    await this.db.achievements.put(AchievementSchema.parse(update(AchievementSchema.parse(achievement))))
  }
}
