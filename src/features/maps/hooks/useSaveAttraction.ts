import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Attraction } from '@/domain/entities/attraction'
import { useRepositories } from '@/shared/hooks/useRepositories'
import { queryKeys } from '@/shared/lib/queryKeys'

export function useSaveAttraction() {
  const { attractionRepository } = useRepositories()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (attraction: Attraction) => attractionRepository.saveAttraction(attraction),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.attractions.all() }),
  })
}
