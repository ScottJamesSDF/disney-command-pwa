import type { Attraction } from '@/domain/entities/attraction'
import { formatParkArea } from '@/domain/constants/parks'
import type { ParkDay } from '@/domain/entities/trip'
import { timeOfDayToDate } from '@/domain/entities/trip'

export type TimelineEntryType = 'attraction' | 'dining' | 'entertainment'
export type TimelineEntryStatus = 'completed' | 'skipped' | 'pending'

export interface TimelineEntry {
  id: string
  type: TimelineEntryType
  time: string
  isEstimated: boolean
  status: TimelineEntryStatus
  title: string
  subtitle: string
  /** Minutes to walk/travel there before this entry starts, if known. */
  walkMinutes?: number
  /** Minutes actually spent at the attraction/show once there (ride duration, show length). */
  durationMinutes?: number
}

/**
 * Merges a day's planned attractions, dining reservations, and entertainment into one
 * chronologically-sorted list. Deliberately independent of the Operations Engine
 * (`commandEngine.ts`) — that engine only ever answers "what's next right now" and has no notion
 * of the past or the full day; this is a read-only, whole-day view.
 *
 * `PlannedAttraction` has no scheduled clock time of its own (only `plannedOrder` and an optional
 * `completedAt`), unlike dining/entertainment which carry real timestamps. Attractions are given an
 * estimated time via a running "depart" cursor, starting from `arrivalTime`: each entry's displayed
 * `time` is the moment you'd actually be at/riding it (depart + walk + wait), not when you leave for
 * it, so it reads as "time at ride" rather than "time you start walking." The cursor then advances by
 * that ride's duration for the next stop's depart time. Whenever a real `completedAt` is known, it's
 * used as-is for that entry's time, and the next depart cursor resets there — so later estimates stay
 * anchored to reality as the day actually unfolds instead of drifting from pure estimation.
 */
export function buildDayTimeline(parkDay: ParkDay, attractions: Attraction[], now: Date): TimelineEntry[] {
  const attractionsById = new Map(attractions.map((a) => [a.id, a]))
  const dayDate = new Date(parkDay.date)
  let departCursor = timeOfDayToDate(parkDay.arrivalTime, dayDate)

  const attractionEntries: TimelineEntry[] = []
  for (const planned of [...parkDay.plannedAttractions].sort((a, b) => a.plannedOrder - b.plannedOrder)) {
    const attraction = attractionsById.get(planned.attractionId)
    if (!attraction) continue

    const status: TimelineEntryStatus = planned.isCompleted
      ? 'completed'
      : planned.isSkipped
        ? 'skipped'
        : 'pending'
    const subtitle = formatParkArea(attraction.park, attraction.area)

    if (planned.completedAt) {
      departCursor = new Date(planned.completedAt)
      attractionEntries.push({
        id: planned.attractionId,
        type: 'attraction',
        time: planned.completedAt,
        isEstimated: false,
        status,
        title: planned.attractionName,
        subtitle,
        walkMinutes: attraction.walkFromHubMinutes,
        durationMinutes: attraction.durationMinutes,
      })
      continue
    }

    const arriveTime = new Date(
      departCursor.getTime() + (attraction.walkFromHubMinutes + attraction.currentWaitMinutes) * 60_000,
    )
    attractionEntries.push({
      id: planned.attractionId,
      type: 'attraction',
      time: arriveTime.toISOString(),
      isEstimated: true,
      status,
      title: planned.attractionName,
      subtitle,
      walkMinutes: attraction.walkFromHubMinutes,
      durationMinutes: attraction.durationMinutes,
    })
    departCursor = new Date(arriveTime.getTime() + attraction.durationMinutes * 60_000)
  }

  const diningEntries: TimelineEntry[] = parkDay.diningReservations.map((reservation) => ({
    id: reservation.id,
    type: 'dining',
    time: reservation.reservationTime,
    isEstimated: false,
    status: reservation.isCompleted ? 'completed' : 'pending',
    title: reservation.restaurantName,
    subtitle: `Party of ${reservation.partySize}`,
  }))

  const entertainmentEntries: TimelineEntry[] = parkDay.entertainment.map((event) => ({
    id: event.id,
    type: 'entertainment',
    time: event.showTime,
    isEstimated: false,
    status: event.isCompleted ? 'completed' : 'pending',
    title: event.name,
    subtitle: event.location,
    walkMinutes: event.recommendedArrivalMinutesBefore,
    durationMinutes: event.durationMinutes,
  }))

  void now // not used to filter — the whole day is shown; `now` is used by the page to highlight position

  return [...attractionEntries, ...diningEntries, ...entertainmentEntries].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
  )
}
