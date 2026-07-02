import { z } from 'zod'

export const WeatherConditionSchema = z.enum(['clear', 'cloudy', 'rain', 'storm', 'other'])
export type WeatherCondition = z.infer<typeof WeatherConditionSchema>

export const WeatherSnapshotSchema = z.object({
  temperatureF: z.number(),
  feelsLikeF: z.number(),
  condition: WeatherConditionSchema,
  precipitationChance: z.number().min(0).max(100),
  windMph: z.number().nonnegative(),
  fetchedAt: z.string().datetime(),
  isStale: z.boolean().default(false),
})
export type WeatherSnapshot = z.infer<typeof WeatherSnapshotSchema>
