import type { Attraction } from '@/domain/entities/attraction'
import type { ParkDay } from '@/domain/entities/trip'

/** Fallback minutes-per-map-unit walking speed, used until a real pace can be calibrated. */
export const DEFAULT_MINUTES_PER_MAP_UNIT = 26

const MIN_PACE_SAMPLES = 2
const MIN_WALK_MINUTES = 1

/** Euclidean distance between two attractions' normalized mapX/mapY positions. */
export function mapDistance(a: Attraction, b: Attraction): number {
  const dx = a.mapX - b.mapX
  const dy = a.mapY - b.mapY
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Learns the user's actual walking pace (minutes per map-unit distance) from today's real
 * completed-attraction timestamps. For each consecutive completed pair (in `plannedOrder`) within
 * the same park, actual elapsed time minus that stop's wait + ride duration gives an observed walk
 * time; dividing by the point-to-point map distance between the two gives one pace sample. Returns
 * the average of all valid samples, or `null` if there aren't at least two yet — callers should fall
 * back to `DEFAULT_MINUTES_PER_MAP_UNIT`. Scoped to today only, so it's always a fresh reflection of
 * how the day is actually going rather than stale data from a different day's conditions.
 */
export function calibratePace(parkDay: ParkDay, attractions: Attraction[]): number | null {
  const attractionsById = new Map(attractions.map((a) => [a.id, a]))
  const completed = parkDay.plannedAttractions
    .filter((p) => p.isCompleted && p.completedAt)
    .sort((a, b) => a.plannedOrder - b.plannedOrder)

  const samples: number[] = []
  for (let i = 1; i < completed.length; i++) {
    const prev = completed[i - 1]
    const curr = completed[i]
    const prevAttraction = attractionsById.get(prev.attractionId)
    const currAttraction = attractionsById.get(curr.attractionId)
    if (!prevAttraction || !currAttraction) continue
    if (prevAttraction.park !== currAttraction.park) continue // cross-park hop, not a walking sample

    const elapsedMinutes =
      (new Date(curr.completedAt!).getTime() - new Date(prev.completedAt!).getTime()) / 60_000
    const wait = curr.actualWaitMinutes ?? currAttraction.currentWaitMinutes
    const walkMinutes = elapsedMinutes - wait - currAttraction.durationMinutes
    const distance = mapDistance(prevAttraction, currAttraction)
    if (walkMinutes <= 0 || distance <= 0) continue // discard outliers/nonsensical samples

    samples.push(walkMinutes / distance)
  }

  if (samples.length < MIN_PACE_SAMPLES) return null
  return samples.reduce((sum, s) => sum + s, 0) / samples.length
}

/**
 * Point-to-point walk minutes from one attraction to the next, in the same park. Distance is always
 * point-to-point (never hub-distance) once there's a `from` attraction; the speed used is the
 * calibrated pace when available, else the default. `from: null` (first attraction of the day) or a
 * cross-park hop falls back to `to.walkFromHubMinutes` — comparing map positions across two
 * different physical parks' independent coordinate spaces isn't meaningful.
 */
export function estimateWalkMinutes(
  from: Attraction | null,
  to: Attraction,
  minutesPerMapUnit: number | null,
): number {
  if (!from || from.park !== to.park) return to.walkFromHubMinutes
  const distance = mapDistance(from, to)
  const minutes = distance * (minutesPerMapUnit ?? DEFAULT_MINUTES_PER_MAP_UNIT)
  return Math.max(MIN_WALK_MINUTES, Math.round(minutes))
}
