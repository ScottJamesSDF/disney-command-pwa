import Dexie, { type EntityTable } from 'dexie'
import type { Achievement } from '@/domain/entities/achievement'
import type { Attraction } from '@/domain/entities/attraction'
import type { Family } from '@/domain/entities/family'
import type { Trip } from '@/domain/entities/trip'
import type { WeatherSnapshot } from '@/domain/entities/weather'

export interface WeatherCacheRow extends WeatherSnapshot {
  key: string
}

/**
 * Local-first IndexedDB store (Dexie). Nested substructures (Trip.parkDays,
 * Family.members) are stored embedded on their parent row rather than
 * normalized into separate tables — the same "flat top-level, nested JSON
 * substructure" strategy the future Supabase schema uses (see
 * docs/DATA_MODEL.md), just applied to a single-document IndexedDB row
 * instead of a `jsonb` column.
 */
export class DisneyCommandDB extends Dexie {
  trips!: EntityTable<Trip, 'id'>
  families!: EntityTable<Family, 'id'>
  attractions!: EntityTable<Attraction, 'id'>
  achievements!: EntityTable<Achievement, 'id'>
  weatherCache!: EntityTable<WeatherCacheRow, 'key'>

  /**
   * Resolves once first-run seeding has completed. `container.ts` overwrites
   * this with the real seeding promise immediately after construction; every
   * repository method awaits it before touching a table, closing the race
   * where a query fires before `seedIfEmpty` has finished writing rows.
   */
  ready: Promise<void> = Promise.resolve()

  constructor() {
    super('disney-command')
    this.version(1).stores({
      trips: 'id, isActive',
      families: 'id',
      attractions: 'id, park, area',
      achievements: 'id, category',
      weatherCache: 'key',
    })
  }
}
