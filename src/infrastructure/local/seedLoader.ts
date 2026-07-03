import { AchievementSchema } from '@/domain/entities/achievement'
import { AttractionSchema } from '@/domain/entities/attraction'
import { FamilySchema, type Family } from '@/domain/entities/family'
import { TripSchema, type Trip } from '@/domain/entities/trip'
import type { DisneyCommandDB } from './db'

import attractionsMagicKingdom from './seed/attractions.magic-kingdom.json'
import attractionsEpcot from './seed/attractions.epcot.json'
import attractionsHollywoodStudios from './seed/attractions.hollywood-studios.json'
import attractionsAnimalKingdom from './seed/attractions.animal-kingdom.json'
import attractionsDisneyland from './seed/attractions.disneyland.json'
import attractionsCaliforniaAdventure from './seed/attractions.california-adventure.json'
import familyJohnsonRaw from './seed/family.johnson.json'
import tripDemoRaw from './seed/trip.demo.json'
import achievementsRaw from './seed/achievements.json'

/** Midnight (local time) of the day `now` falls on. */
function todayMidnight(now: Date): Date {
  const midnight = new Date(now)
  midnight.setHours(0, 0, 0, 0)
  return midnight
}

function offsetDaysToISO(offsetDays: number, now: Date): string {
  const date = new Date(todayMidnight(now))
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString()
}

function minutesFromMidnightToISO(minutes: number, now: Date): string {
  return new Date(todayMidnight(now).getTime() + minutes * 60_000).toISOString()
}

function minutesAgoToISO(minutesAgo: number, now: Date): string {
  return new Date(now.getTime() - minutesAgo * 60_000).toISOString()
}

function minutesFromNowToISO(minutesFromNow: number, now: Date): string {
  return new Date(now.getTime() + minutesFromNow * 60_000).toISOString()
}

function hoursAgoToISO(hoursAgo: number, now: Date): string {
  return new Date(now.getTime() - hoursAgo * 3_600_000).toISOString()
}

interface RawFamilyMember {
  id: string
  name: string
  age: number
  heightCm: number
  ageGroup: string
  energyLevel: string
  favoriteAttractions: string[]
  dislikedAttractions: string[]
  needsStroller: boolean
  avatarEmoji?: string
  stepsToday: number
  ridesCompleted: number
  lastHydrationReminderMinutesAgo: number
  lastRestBreakHoursAgo: number
}

interface RawFamily {
  id: string
  name: string
  createdAt: string
  members: RawFamilyMember[]
}

function resolveFamily(raw: RawFamily, now: Date): Family {
  return FamilySchema.parse({
    id: raw.id,
    name: raw.name,
    createdAt: raw.createdAt,
    members: raw.members.map((member) => ({
      ...member,
      lastHydrationReminder: minutesAgoToISO(member.lastHydrationReminderMinutesAgo, now),
      lastRestBreak: hoursAgoToISO(member.lastRestBreakHoursAgo, now),
    })),
  })
}

interface RawPlannedAttraction {
  attractionId: string
  attractionName: string
  plannedOrder: number
  isCompleted: boolean
  completedMinutesAgo?: number
  usedLightningLane: boolean
  actualWaitMinutes?: number
  isSkipped: boolean
}

interface RawDiningReservation {
  id: string
  restaurantName: string
  restaurantId: string
  reservationTimeMinutesFromMidnight: number
  partySize: number
  isConfirmed: boolean
  confirmationNumber?: string
  isMobileOrder: boolean
  isCompleted: boolean
}

interface RawEntertainmentEvent {
  id: string
  name: string
  showTimeMinutesFromMidnight: number
  location: string
  durationMinutes: number
  recommendedArrivalMinutesBefore: number
  isCompleted: boolean
}

interface RawParkDay {
  id: string
  dateOffsetDays: number
  park: string
  parkOpenTime: { hour: number; minute: number }
  parkCloseTime: { hour: number; minute: number }
  arrivalTime: { hour: number; minute: number }
  hasParkHopper: boolean
  plannedAttractions: RawPlannedAttraction[]
  diningReservations: RawDiningReservation[]
  entertainment: RawEntertainmentEvent[]
}

interface RawTrip {
  id: string
  name: string
  startDateOffsetDays: number
  endDateOffsetDays: number
  familyId: string
  hotelName?: string
  notes?: string
  isActive: boolean
  createdAt: string
  parkDays: RawParkDay[]
}

function resolveTrip(raw: RawTrip, now: Date): Trip {
  return TripSchema.parse({
    id: raw.id,
    name: raw.name,
    startDate: offsetDaysToISO(raw.startDateOffsetDays, now),
    endDate: offsetDaysToISO(raw.endDateOffsetDays, now),
    familyId: raw.familyId,
    hotelName: raw.hotelName,
    notes: raw.notes,
    isActive: raw.isActive,
    createdAt: raw.createdAt,
    parkDays: raw.parkDays.map((day) => ({
      id: day.id,
      date: offsetDaysToISO(day.dateOffsetDays, now),
      park: day.park,
      parkOpenTime: day.parkOpenTime,
      parkCloseTime: day.parkCloseTime,
      arrivalTime: day.arrivalTime,
      hasParkHopper: day.hasParkHopper,
      plannedAttractions: day.plannedAttractions.map((p) => ({
        attractionId: p.attractionId,
        attractionName: p.attractionName,
        plannedOrder: p.plannedOrder,
        isCompleted: p.isCompleted,
        completedAt:
          p.isCompleted && p.completedMinutesAgo != null
            ? minutesAgoToISO(p.completedMinutesAgo, now)
            : null,
        usedLightningLane: p.usedLightningLane,
        actualWaitMinutes: p.actualWaitMinutes,
        isSkipped: p.isSkipped,
      })),
      diningReservations: day.diningReservations.map((d) => ({
        id: d.id,
        restaurantName: d.restaurantName,
        restaurantId: d.restaurantId,
        reservationTime: minutesFromMidnightToISO(d.reservationTimeMinutesFromMidnight, now),
        partySize: d.partySize,
        isConfirmed: d.isConfirmed,
        confirmationNumber: d.confirmationNumber,
        isMobileOrder: d.isMobileOrder,
        isCompleted: d.isCompleted,
      })),
      entertainment: day.entertainment.map((e) => ({
        id: e.id,
        name: e.name,
        showTime: minutesFromMidnightToISO(e.showTimeMinutesFromMidnight, now),
        location: e.location,
        durationMinutes: e.durationMinutes,
        recommendedArrivalMinutesBefore: e.recommendedArrivalMinutesBefore,
        isCompleted: e.isCompleted,
      })),
    })),
  })
}

/**
 * Seeds the local database on first run. Relative-time fields in the seed
 * fixtures (e.g. "30 minutes ago", "today at 12:30pm") are resolved against
 * `now` so the demo data always looks live regardless of when the app is
 * first opened.
 */
export async function seedIfEmpty(db: DisneyCommandDB, now: Date = new Date()): Promise<void> {
  const existingTripCount = await db.trips.count()
  if (existingTripCount > 0) return

  const attractions = [
    ...attractionsMagicKingdom,
    ...attractionsEpcot,
    ...attractionsHollywoodStudios,
    ...attractionsAnimalKingdom,
    ...attractionsDisneyland,
    ...attractionsCaliforniaAdventure,
  ].map((raw) => {
    const { lightningLaneReturnTimeMinutesFromNow, ...rest } = raw as typeof raw & {
      lightningLaneReturnTimeMinutesFromNow?: number
    }
    return AttractionSchema.parse({
      ...rest,
      lightningLaneReturnTime:
        lightningLaneReturnTimeMinutesFromNow != null
          ? minutesFromNowToISO(lightningLaneReturnTimeMinutesFromNow, now)
          : (rest.lightningLaneReturnTime ?? null),
    })
  })
  const achievements = achievementsRaw.map((a) => AchievementSchema.parse(a))
  const family = resolveFamily(familyJohnsonRaw as RawFamily, now)
  const trip = resolveTrip(tripDemoRaw as RawTrip, now)

  await db.transaction(
    'rw',
    db.trips,
    db.families,
    db.attractions,
    db.achievements,
    async () => {
      await db.attractions.bulkPut(attractions)
      await db.achievements.bulkPut(achievements)
      await db.families.put(family)
      await db.trips.put(trip)
    },
  )
}
