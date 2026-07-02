import { createContext } from 'react'
import type { RepositoryContainer } from '@/infrastructure/container'

export const RepositoryContext = createContext<RepositoryContainer | null>(null)
