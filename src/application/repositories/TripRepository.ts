import type { Trip } from '@/domain/entities/trip'

export interface TripRepository {
  getActiveTrip(): Promise<Trip | null>
  markAttractionCompleted(
    parkDayId: string,
    attractionId: string,
    completedAt: Date,
  ): Promise<void>
  skipAttraction(parkDayId: string, attractionId: string): Promise<void>
}
