import { use } from 'react'
import { RepositoryContext } from '@/app/providers/RepositoryContext'
import type { RepositoryContainer } from '@/infrastructure/container'

/**
 * The sole consumption point for repositories outside of `container.ts` and
 * `RepositoryProvider` itself — feature code must never import a concrete
 * `Local*Repository`/`OpenMeteoWeatherRepository` class directly.
 */
export function useRepositories(): RepositoryContainer {
  const container = use(RepositoryContext)
  if (!container) {
    throw new Error('useRepositories must be used within a RepositoryProvider.')
  }
  return container
}
