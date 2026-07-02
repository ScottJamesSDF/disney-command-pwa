import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Trip } from '@/domain/entities/trip'
import { useRepositories } from '@/shared/hooks/useRepositories'
import { queryKeys } from '@/shared/lib/queryKeys'

export function useSaveTrip() {
  const { tripRepository } = useRepositories()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (trip: Trip) => tripRepository.saveTrip(trip),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.trip.active() }),
  })
}
