import { z } from 'zod'
import { AttractionSchema } from './attraction'

export const CommandTypeSchema = z.enum([
  'walkToAttraction',
  'rideNow',
  'bookLightningLane',
  'headToDining',
  'snackBreak',
  'restroomBreak',
  'restArea',
  'hydrationReminder',
  'meetCharacter',
  'watchShow',
  'shopStop',
  'photoSpot',
  'contingency',
  'celebrate',
  'endOfDay',
])
export type CommandType = z.infer<typeof CommandTypeSchema>

export const CommandPrioritySchema = z.enum(['critical', 'high', 'normal', 'low'])
export type CommandPriority = z.infer<typeof CommandPrioritySchema>

export const CommandStatusSchema = z.enum(['active', 'completed', 'skipped', 'expired'])
export type CommandStatus = z.infer<typeof CommandStatusSchema>

export const NextCommandSchema = z.object({
  id: z.string(),
  type: CommandTypeSchema,
  priority: CommandPrioritySchema,
  headline: z.string(),
  subtext: z.string(),
  walkMinutes: z.number().int().nonnegative(),
  waitMinutes: z.number().int().nonnegative().optional(),
  durationMinutes: z.number().int().nonnegative().optional(),
  estimatedCompletion: z.string().datetime().optional(),
  lightningLaneReady: z.boolean().default(false),
  lightningLaneNote: z.string().optional(),
  attraction: AttractionSchema.nullable().default(null),
  locationName: z.string().optional(),
  contingencyReason: z.string().optional(),
  status: CommandStatusSchema.default('active'),
  generatedAt: z.string().datetime(),
  metadata: z.record(z.string(), z.unknown()).default({}),
})
export type NextCommand = z.infer<typeof NextCommandSchema>

export const CommandQueueSchema = z.object({
  current: NextCommandSchema,
  upcoming: z.array(NextCommandSchema),
  lastUpdated: z.string().datetime(),
})
export type CommandQueue = z.infer<typeof CommandQueueSchema>

export function totalMinutes(command: NextCommand): number {
  return command.walkMinutes + (command.waitMinutes ?? 0) + (command.durationMinutes ?? 0)
}

export function timeLabel(command: NextCommand): string {
  const total = totalMinutes(command)
  if (total >= 60) {
    const hours = Math.floor(total / 60)
    const minutes = total % 60
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }
  return `${total} min`
}

export function next3(queue: CommandQueue): NextCommand[] {
  return queue.upcoming.slice(0, 3)
}

/**
 * Builds a `NextCommand` for the common case (no attraction attached, no
 * Lightning Lane), filling in the schema's default fields so call sites don't
 * have to repeat `lightningLaneReady: false, attraction: null` everywhere.
 */
export function createNextCommand(
  fields: Omit<NextCommand, 'lightningLaneReady' | 'attraction' | 'status' | 'metadata'> &
    Partial<Pick<NextCommand, 'lightningLaneReady' | 'attraction' | 'status' | 'metadata'>>,
): NextCommand {
  return {
    lightningLaneReady: false,
    attraction: null,
    status: 'active',
    metadata: {},
    ...fields,
  }
}
