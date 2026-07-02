import { z } from 'zod'

export const AchievementCategorySchema = z.enum([
  'rides',
  'dining',
  'characters',
  'exploration',
  'endurance',
  'speed',
  'family',
  'galaxysEdge',
  'special',
])
export type AchievementCategory = z.infer<typeof AchievementCategorySchema>

export const AchievementSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  emoji: z.string(),
  category: AchievementCategorySchema,
  pointValue: z.number().int().nonnegative(),
  isUnlocked: z.boolean(),
  unlockedAt: z.string().datetime().nullable().default(null),
  progress: z.number().nonnegative().optional(),
  target: z.number().positive().optional(),
  isSecret: z.boolean().default(false),
  celebrationMessage: z.string().optional(),
})
export type Achievement = z.infer<typeof AchievementSchema>

/** Ported from `Achievement.progressPercent`. */
export function progressPercent(achievement: Achievement): number {
  if (achievement.isUnlocked) return 1
  if (achievement.progress == null || achievement.target == null || achievement.target === 0) {
    return 0
  }
  return Math.min(Math.max(achievement.progress / achievement.target, 0), 1)
}
