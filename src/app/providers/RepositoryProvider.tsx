import { useEffect, useState, type ReactNode } from 'react'
import { createContainer, type RepositoryContainer } from '@/infrastructure/container'
import { RepositoryContext } from './RepositoryContext'

export function RepositoryProvider({ children }: { children: ReactNode }) {
  const [container] = useState<RepositoryContainer>(() => createContainer())

  useEffect(() => {
    return () => container.dispose()
  }, [container])

  return <RepositoryContext.Provider value={container}>{children}</RepositoryContext.Provider>
}
