import type {
  DiningReservation,
  EntertainmentEvent,
  ParkDay,
  Trip,
} from '@/domain/entities/trip'

function isSameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** Ported from `Trip.todayParkDay`. */
export function getTodayParkDay(trip: Trip, now: Date): ParkDay | null {
  return trip.parkDays.find((day) => isSameDate(new Date(day.date), now)) ?? null
}

/** Ported from `Trip.totalDays`. */
export function totalDays(trip: Trip): number {
  const start = new Date(trip.startDate)
  const end = new Date(trip.endDate)
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1
}

/** Ported from `Trip.daysUntilTrip`. */
export function daysUntilTrip(trip: Trip, now: Date): number {
  const start = new Date(trip.startDate)
  return Math.ceil((start.getTime() - now.getTime()) / 86_400_000)
}

/** Ported from `Trip.hasStarted`. */
export function hasStarted(trip: Trip, now: Date): boolean {
  return now.getTime() >= new Date(trip.startDate).getTime()
}

/** Ported from `Trip.hasEnded` (includes a one-day buffer past `endDate`). */
export function hasEnded(trip: Trip, now: Date): boolean {
  const end = new Date(trip.endDate)
  end.setDate(end.getDate() + 1)
  return now.getTime() >= end.getTime()
}

/** Ported from `ParkDay.completedAttractions`. */
export function completedAttractions(parkDay: ParkDay): number {
  return parkDay.plannedAttractions.filter((a) => a.isCompleted).length
}

/** Ported from `ParkDay.completionPercent`. */
export function completionPercent(parkDay: ParkDay): number {
  if (parkDay.plannedAttractions.length === 0) return 0
  return completedAttractions(parkDay) / parkDay.plannedAttractions.length
}

/**
 * Ported from `DiningReservation.minutesUntil`, made pure by taking `now`
 * explicitly instead of reading `DateTime.now()` internally.
 */
export function minutesUntilDining(reservation: DiningReservation, now: Date): number {
  return (new Date(reservation.reservationTime).getTime() - now.getTime()) / 60_000
}

/** Ported from `EntertainmentEvent.recommendedArrivalTime`. */
export function recommendedArrivalTime(event: EntertainmentEvent): Date {
  const showTime = new Date(event.showTime)
  return new Date(showTime.getTime() - event.recommendedArrivalMinutesBefore * 60_000)
}

/**
 * Ported from `EntertainmentEvent.minutesUntilArrival`, made pure by taking
 * `now` explicitly instead of reading `DateTime.now()` internally.
 */
export function minutesUntilEntertainmentArrival(event: EntertainmentEvent, now: Date): number {
  return (recommendedArrivalTime(event).getTime() - now.getTime()) / 60_000
}
