import { z } from 'zod'
import { ParkIdSchema } from './attraction'

export const TimeOfDaySchema = z.object({
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
})
export type TimeOfDay = z.infer<typeof TimeOfDaySchema>

export function timeOfDayToDate(time: TimeOfDay, date: Date): Date {
  const result = new Date(date)
  result.setHours(time.hour, time.minute, 0, 0)
  return result
}

export function formatTimeOfDay(time: TimeOfDay): string {
  const period = time.hour >= 12 ? 'PM' : 'AM'
  const hour12 = time.hour % 12 === 0 ? 12 : time.hour % 12
  return `${hour12}:${String(time.minute).padStart(2, '0')} ${period}`
}

export const PlannedAttractionSchema = z.object({
  attractionId: z.string(),
  attractionName: z.string(),
  plannedOrder: z.number().int().nonnegative(),
  isCompleted: z.boolean(),
  completedAt: z.string().datetime().nullable().default(null),
  usedLightningLane: z.boolean(),
  actualWaitMinutes: z.number().int().nonnegative().optional(),
  isSkipped: z.boolean().default(false),
})
export type PlannedAttraction = z.infer<typeof PlannedAttractionSchema>

export const DiningReservationSchema = z.object({
  id: z.string(),
  restaurantName: z.string(),
  restaurantId: z.string(),
  reservationTime: z.string().datetime(),
  partySize: z.number().int().positive(),
  isConfirmed: z.boolean(),
  confirmationNumber: z.string().optional(),
  isMobileOrder: z.boolean(),
  isCompleted: z.boolean(),
})
export type DiningReservation = z.infer<typeof DiningReservationSchema>

export const EntertainmentEventSchema = z.object({
  id: z.string(),
  name: z.string(),
  showTime: z.string().datetime(),
  location: z.string(),
  durationMinutes: z.number().int().positive(),
  recommendedArrivalMinutesBefore: z.number().int().nonnegative(),
  isCompleted: z.boolean(),
})
export type EntertainmentEvent = z.infer<typeof EntertainmentEventSchema>

export const ParkDaySchema = z.object({
  id: z.string(),
  date: z.string().datetime(),
  park: ParkIdSchema,
  parkOpenTime: TimeOfDaySchema,
  parkCloseTime: TimeOfDaySchema,
  arrivalTime: TimeOfDaySchema,
  plannedAttractions: z.array(PlannedAttractionSchema),
  diningReservations: z.array(DiningReservationSchema),
  entertainment: z.array(EntertainmentEventSchema),
  hasParkHopper: z.boolean(),
  eveningPark: ParkIdSchema.optional(),
})
export type ParkDay = z.infer<typeof ParkDaySchema>

export const TripSchema = z.object({
  id: z.string(),
  name: z.string(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  familyId: z.string(),
  parkDays: z.array(ParkDaySchema),
  hotelName: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
})
export type Trip = z.infer<typeof TripSchema>
