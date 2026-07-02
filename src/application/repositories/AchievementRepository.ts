import type { Achievement } from '@/domain/entities/achievement'

export interface AchievementRepository {
  getAll(): Promise<Achievement[]>
  unlock(id: string, at: Date): Promise<void>
  updateProgress(id: string, progress: number): Promise<void>
}
