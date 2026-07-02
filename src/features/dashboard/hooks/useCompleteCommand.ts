import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { NextCommand } from '@/domain/entities/command'
import { useRepositories } from '@/shared/hooks/useRepositories'
import { queryKeys } from '@/shared/lib/queryKeys'
import { useDashboardStore } from '../dashboard.store'
import { useCommandQueue } from './useCommandQueue'

interface UseCompleteCommandResult {
  completeCommand: (command: NextCommand) => void
  skipCommand: (command: NextCommand) => void
  isPending: boolean
}

export function useCompleteCommand(): UseCompleteCommandResult {
  const { tripRepository } = useRepositories()
  const { parkDay } = useCommandQueue()
  const queryClient = useQueryClient()
  const markOptimistic = useDashboardStore((state) => state.markOptimistic)
  const clearOptimistic = useDashboardStore((state) => state.clearOptimistic)

  const mutation = useMutation({
    mutationFn: async ({
      command,
      action,
    }: {
      command: NextCommand
      action: 'complete' | 'skip'
    }) => {
      if (!parkDay || !command.attraction) return
      if (action === 'complete') {
        await tripRepository.markAttractionCompleted(parkDay.id, command.attraction.id, new Date())
      } else {
        await tripRepository.skipAttraction(parkDay.id, command.attraction.id)
      }
    },
    onMutate: ({ command }) => markOptimistic(command.id),
    onSettled: (_data, _error, { command }) => {
      clearOptimistic(command.id)
      void queryClient.invalidateQueries({ queryKey: queryKeys.trip.active() })
    },
  })

  return {
    completeCommand: (command) => mutation.mutate({ command, action: 'complete' }),
    skipCommand: (command) => mutation.mutate({ command, action: 'skip' }),
    isPending: mutation.isPending,
  }
}
