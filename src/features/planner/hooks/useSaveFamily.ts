import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Family } from '@/domain/entities/family'
import { useRepositories } from '@/shared/hooks/useRepositories'
import { queryKeys } from '@/shared/lib/queryKeys'

export function useSaveFamily() {
  const { familyRepository } = useRepositories()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (family: Family) => familyRepository.saveFamily(family),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.family.active() }),
  })
}
