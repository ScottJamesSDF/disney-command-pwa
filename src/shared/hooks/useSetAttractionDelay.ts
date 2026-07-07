import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRepositories } from '@/shared/hooks/useRepositories'
import { queryKeys } from '@/shared/lib/queryKeys'

interface SetAttractionDelayInput {
  parkDayId: string
  attractionId: string
  delayMinutes: number
}

/** Shared by Dashboard and Timeline — both read the same `trip.active()` query. */
export function useSetAttractionDelay() {
  const { tripRepository } = useRepositories()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ parkDayId, attractionId, delayMinutes }: SetAttractionDelayInput) =>
      tripRepository.setAttractionDelay(parkDayId, attractionId, delayMinutes),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.trip.active() }),
  })
}
