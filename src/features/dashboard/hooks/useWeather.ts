import { useQuery } from '@tanstack/react-query'
import { MAGIC_KINGDOM_COORDS } from '@/domain/constants/parks'
import { useRepositories } from '@/shared/hooks/useRepositories'
import { queryKeys } from '@/shared/lib/queryKeys'

const REFETCH_INTERVAL_MS = 15 * 60_000

export function useWeather(lat: number = MAGIC_KINGDOM_COORDS.lat, lng: number = MAGIC_KINGDOM_COORDS.lng) {
  const { weatherRepository } = useRepositories()

  return useQuery({
    queryKey: queryKeys.weather.current(lat, lng),
    queryFn: () => weatherRepository.getCurrentWeather(lat, lng),
    staleTime: REFETCH_INTERVAL_MS,
    refetchInterval: REFETCH_INTERVAL_MS,
  })
}
