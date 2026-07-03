import type { AttractionRepository } from '@/application/repositories/AttractionRepository'
import { AttractionSchema, type Attraction, type ParkId } from '@/domain/entities/attraction'
import type { DisneyCommandDB } from '../db'

const SIMULATION_INTERVAL_MS = 30_000
const WAIT_JITTER_MINUTES = 5
const LL_AVAILABILITY_FLIP_PROBABILITY = 0.05

function jitterWait(currentWaitMinutes: number, averageWaitMinutes: number): number {
  const delta = Math.round((Math.random() * 2 - 1) * WAIT_JITTER_MINUTES)
  const max = Math.max(averageWaitMinutes * 2, 15)
  return Math.min(Math.max(currentWaitMinutes + delta, 0), max)
}

/**
 * Pure jitter step, extracted from the repository so it can be unit tested
 * deterministically (by stubbing `Math.random`) without touching Dexie or
 * real/fake timers.
 */
export function simulateAttractionTick(attractions: Attraction[]): Attraction[] {
  return attractions.map((attraction) => {
    const next: Attraction = {
      ...attraction,
      currentWaitMinutes: jitterWait(attraction.currentWaitMinutes, attraction.averageWaitMinutes),
    }
    if (next.hasLightningLane && Math.random() < LL_AVAILABILITY_FLIP_PROBABILITY) {
      next.lightningLaneAvailable = !next.lightningLaneAvailable
    }
    return AttractionSchema.parse(next)
  })
}

/**
 * Local-first implementation backed by Dexie. Also owns a lightweight "live"
 * wait-time/Lightning-Lane-availability simulator so the Dashboard feels
 * dynamic in the absence of a real park-data API (a real implementation would
 * poll a live wait-times API here instead).
 */
export class LocalAttractionRepository implements AttractionRepository {
  private intervalId: ReturnType<typeof setInterval> | null = null
  private readonly db: DisneyCommandDB

  constructor(db: DisneyCommandDB) {
    this.db = db
  }

  async getLiveAttractions(park: ParkId): Promise<Attraction[]> {
    await this.db.ready
    const attractions = await this.db.attractions.where('park').equals(park).toArray()
    return attractions.map((a) => AttractionSchema.parse(a))
  }

  async getAllAttractions(): Promise<Attraction[]> {
    await this.db.ready
    const attractions = await this.db.attractions.toArray()
    return attractions.map((a) => AttractionSchema.parse(a))
  }

  async saveAttraction(attraction: Attraction): Promise<void> {
    await this.db.ready
    await this.db.attractions.put(AttractionSchema.parse(attraction))
  }

  /** Starts the periodic wait-time/LL-availability jitter. No-op if already running. */
  startLiveSimulation(): void {
    if (this.intervalId != null) return
    this.intervalId = setInterval(() => {
      void this.tick()
    }, SIMULATION_INTERVAL_MS)
  }

  stopLiveSimulation(): void {
    if (this.intervalId != null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  private async tick(): Promise<void> {
    await this.db.ready
    const attractions = await this.db.attractions.toArray()
    await this.db.attractions.bulkPut(simulateAttractionTick(attractions))
  }
}
