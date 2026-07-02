import type { AchievementRepository } from '@/application/repositories/AchievementRepository'
import type { AttractionRepository } from '@/application/repositories/AttractionRepository'
import type { FamilyRepository } from '@/application/repositories/FamilyRepository'
import type { TripRepository } from '@/application/repositories/TripRepository'
import type { WeatherRepository } from '@/application/repositories/WeatherRepository'
import { DisneyCommandDB } from './local/db'
import { seedIfEmpty } from './local/seedLoader'
import { LocalAchievementRepository } from './local/repositories/LocalAchievementRepository'
import { LocalAttractionRepository } from './local/repositories/LocalAttractionRepository'
import { LocalFamilyRepository } from './local/repositories/LocalFamilyRepository'
import { LocalTripRepository } from './local/repositories/LocalTripRepository'
import { OpenMeteoWeatherRepository } from './weather/OpenMeteoWeatherRepository'

export interface RepositoryContainer {
  tripRepository: TripRepository
  familyRepository: FamilyRepository
  attractionRepository: AttractionRepository
  achievementRepository: AchievementRepository
  weatherRepository: WeatherRepository
  /** Releases background resources (e.g. the live-attraction simulator). */
  dispose: () => void
}

/**
 * The single swap point for backend implementations. Phase 1 ships only the
 * `local` backend; a `VITE_DATA_BACKEND=supabase` branch will be added here
 * in Phase 2+ once `Supabase*Repository` classes exist — no other code in
 * the app imports a concrete repository class directly (see
 * `app/providers/RepositoryProvider.tsx`), so that addition is the only
 * change required to switch backends.
 */
export function createContainer(): RepositoryContainer {
  const backend = import.meta.env.VITE_DATA_BACKEND ?? 'local'
  if (backend !== 'local') {
    throw new Error(
      `Unsupported VITE_DATA_BACKEND "${backend}" — only "local" is implemented in Phase 1.`,
    )
  }

  const db = new DisneyCommandDB()
  db.ready = seedIfEmpty(db)

  const attractionRepository = new LocalAttractionRepository(db)
  attractionRepository.startLiveSimulation()

  return {
    tripRepository: new LocalTripRepository(db),
    familyRepository: new LocalFamilyRepository(db),
    attractionRepository,
    achievementRepository: new LocalAchievementRepository(db),
    weatherRepository: new OpenMeteoWeatherRepository(db),
    dispose: () => attractionRepository.stopLiveSimulation(),
  }
}
