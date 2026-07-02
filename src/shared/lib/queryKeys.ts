import type { ParkId } from '@/domain/entities/attraction'

export const queryKeys = {
  trip: {
    active: () => ['trip', 'active'] as const,
  },
  family: {
    active: () => ['family', 'active'] as const,
  },
  attractions: {
    live: (park: ParkId) => ['attractions', 'live', park] as const,
    all: () => ['attractions', 'all'] as const,
  },
  achievements: {
    all: () => ['achievements', 'all'] as const,
  },
  weather: {
    current: (lat: number, lng: number) => ['weather', 'current', lat, lng] as const,
  },
}
