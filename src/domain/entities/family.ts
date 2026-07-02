import { z } from 'zod'

export const EnergyLevelSchema = z.enum(['high', 'medium', 'low', 'exhausted'])
export type EnergyLevel = z.infer<typeof EnergyLevelSchema>

/** Ordinal index for averaging — mirrors the source enum's declaration order. */
export const ENERGY_LEVEL_ORDER: EnergyLevel[] = ['high', 'medium', 'low', 'exhausted']

export const AgeGroupSchema = z.enum(['toddler', 'child', 'tween', 'teen', 'adult', 'senior'])
export type AgeGroup = z.infer<typeof AgeGroupSchema>

export const FamilyMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  age: z.number().int().nonnegative(),
  heightCm: z.number().positive(),
  ageGroup: AgeGroupSchema,
  energyLevel: EnergyLevelSchema,
  favoriteAttractions: z.array(z.string()),
  dislikedAttractions: z.array(z.string()),
  needsStroller: z.boolean(),
  avatarEmoji: z.string().optional(),
  stepsToday: z.number().int().nonnegative(),
  ridesCompleted: z.number().int().nonnegative(),
  lastHydrationReminder: z.string().datetime(),
  lastRestBreak: z.string().datetime(),
})
export type FamilyMember = z.infer<typeof FamilyMemberSchema>

export const FamilySchema = z.object({
  id: z.string(),
  name: z.string(),
  members: z.array(FamilyMemberSchema),
  createdAt: z.string().datetime(),
})
export type Family = z.infer<typeof FamilySchema>
