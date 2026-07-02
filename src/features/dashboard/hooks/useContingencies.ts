import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { detectContingencies, type Contingency } from '@/application/engines/decisionEngine'
import { useRepositories } from '@/shared/hooks/useRepositories'
import { useTicker } from '@/shared/hooks/useTicker'
import { queryKeys } from '@/shared/lib/queryKeys'
import { useCommandQueue } from './useCommandQueue'

const ENGINE_RECOMPUTE_INTERVAL_MS = 15_000

export function useContingencies(): Contingency[] {
  const { attractionRepository } = useRepositories()
  const { queue, parkDay, family } = useCommandQueue()
  const bucketedNow = useTicker(ENGINE_RECOMPUTE_INTERVAL_MS)

  const attractionsQuery = useQuery({
    queryKey: queryKeys.attractions.live(parkDay?.park ?? 'magicKingdom'),
    queryFn: () => attractionRepository.getLiveAttractions(parkDay!.park),
    enabled: parkDay != null,
  })

  const currentCommand = queue?.current

  return useMemo(() => {
    if (!currentCommand || !parkDay || !family || !attractionsQuery.data) return []
    return detectContingencies({
      currentCommand,
      parkDay,
      family,
      liveAttractions: attractionsQuery.data,
      currentTime: bucketedNow,
    })
  }, [currentCommand, parkDay, family, attractionsQuery.data, bucketedNow])
}
