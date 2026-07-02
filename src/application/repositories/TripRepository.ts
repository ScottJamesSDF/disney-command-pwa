import type { Trip } from '@/domain/entities/trip'

export interface TripRepository {
  getActiveTrip(): Promise<Trip | null>
  /** Upserts a trip. If `trip.isActive` is true, deactivates any other active trip. */
  saveTrip(trip: Trip): Promise<void>
  markAttractionCompleted(
    parkDayId: string,
    attractionId: string,
    completedAt: Date,
  ): Promise<void>
  skipAttraction(parkDayId: string, attractionId: string): Promise<void>
}
