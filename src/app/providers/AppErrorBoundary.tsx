import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { Button } from '@/shared/components/ui/button'

export function AppErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error) => console.error('Unhandled application error:', error)}
      fallback={(error, reset) => (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
          <AlertTriangle className="size-10 text-status-caution" />
          <h1 className="text-lg font-semibold">Mission Control Offline</h1>
          <p className="max-w-sm text-sm text-muted-foreground">{error.message}</p>
          <Button onClick={reset}>Try again</Button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}
