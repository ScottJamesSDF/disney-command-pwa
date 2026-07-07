import type { TripRepository } from '@/application/repositories/TripRepository'
import { TripSchema, type Trip } from '@/domain/entities/trip'
import type { DisneyCommandDB } from '../db'

export class LocalTripRepository implements TripRepository {
  private readonly db: DisneyCommandDB

  constructor(db: DisneyCommandDB) {
    this.db = db
  }

  async getActiveTrip(): Promise<Trip | null> {
    await this.db.ready
    const trip = await this.db.trips.filter((t) => t.isActive).first()
    return trip ? TripSchema.parse(trip) : null
  }

  async saveTrip(trip: Trip): Promise<void> {
    await this.db.ready
    const validated = TripSchema.parse(trip)

    await this.db.transaction('rw', this.db.trips, async () => {
      if (validated.isActive) {
        const others = await this.db.trips
          .filter((t) => t.isActive && t.id !== validated.id)
          .toArray()
        await Promise.all(
          others.map((other) =>
            this.db.trips.put(TripSchema.parse({ ...other, isActive: false })),
          ),
        )
      }
      await this.db.trips.put(validated)
    })
  }

  async markAttractionCompleted(
    parkDayId: string,
    attractionId: string,
    completedAt: Date,
  ): Promise<void> {
    await this.updatePlannedAttraction(parkDayId, attractionId, (planned) => ({
      ...planned,
      isCompleted: true,
      completedAt: completedAt.toISOString(),
      isSkipped: false,
    }))
  }

  async skipAttraction(parkDayId: string, attractionId: string): Promise<void> {
    await this.updatePlannedAttraction(parkDayId, attractionId, (planned) => ({
      ...planned,
      isSkipped: true,
    }))
  }

  async setAttractionDelay(
    parkDayId: string,
    attractionId: string,
    delayMinutes: number,
  ): Promise<void> {
    await this.updatePlannedAttraction(parkDayId, attractionId, (planned) => ({
      ...planned,
      delayMinutes,
    }))
  }

  private async updatePlannedAttraction(
    parkDayId: string,
    attractionId: string,
    update: (planned: Trip['parkDays'][number]['plannedAttractions'][number]) => Trip['parkDays'][number]['plannedAttractions'][number],
  ): Promise<void> {
    const trip = await this.getActiveTrip()
    if (!trip) throw new Error('No active trip found.')

    const updatedTrip: Trip = {
      ...trip,
      parkDays: trip.parkDays.map((day) => {
        if (day.id !== parkDayId) return day
        return {
          ...day,
          plannedAttractions: day.plannedAttractions.map((planned) =>
            planned.attractionId === attractionId ? update(planned) : planned,
          ),
        }
      }),
    }

    await this.db.trips.put(TripSchema.parse(updatedTrip))
  }
}
