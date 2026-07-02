import { RouterProvider } from 'react-router-dom'
import { AppErrorBoundary } from '@/app/providers/AppErrorBoundary'
import { QueryProvider } from '@/app/providers/QueryProvider'
import { RepositoryProvider } from '@/app/providers/RepositoryProvider'
import { ThemeProvider } from '@/app/providers/ThemeProvider'
import { router } from '@/app/routes'

export function App() {
  return (
    <AppErrorBoundary>
      <QueryProvider>
        <RepositoryProvider>
          <ThemeProvider>
            <RouterProvider router={router} />
          </ThemeProvider>
        </RepositoryProvider>
      </QueryProvider>
    </AppErrorBoundary>
  )
}
