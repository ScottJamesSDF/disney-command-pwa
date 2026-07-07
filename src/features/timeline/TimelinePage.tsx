import { useQueryClient } from '@tanstack/react-query'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { DashboardErrorFallback } from '@/features/dashboard/components/DashboardErrorFallback'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Separator } from '@/shared/components/ui/separator'
import { TimelineSkeleton } from './components/TimelineSkeleton'
import { TimelineEntryRow } from './components/TimelineEntryRow'
import { useTimeline } from './hooks/useTimeline'

function TimelineContent() {
  const { entries, parkDay, now, isPending, isError, error } = useTimeline()
  const queryClient = useQueryClient()

  if (isPending) return <TimelineSkeleton />

  if (isError) {
    return (
      <DashboardErrorFallback
        message={error instanceof Error ? error.message : 'Something went wrong loading your day.'}
        onRetry={() => void queryClient.invalidateQueries()}
      />
    )
  }

  if (!parkDay) {
    return (
      <DashboardErrorFallback
        message="No active trip found for today. Start a trip in the Planner to see your schedule."
        onRetry={() => void queryClient.invalidateQueries()}
        action={{ label: 'Go to Planner', to: '/planner' }}
      />
    )
  }

  const currentEntry = entries.find((e) => new Date(e.time).getTime() >= now.getTime())

  return (
    <Card className="py-4">
      <CardHeader className="pt-0">
        <CardTitle className="text-base">Today's Schedule</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 pb-0">
        {entries.length === 0 && (
          <p className="text-sm text-muted-foreground">Nothing planned for today yet.</p>
        )}
        {entries.map((entry, index) => (
          <div key={`${entry.type}-${entry.id}`}>
            {index > 0 && <Separator className="my-1" />}
            <TimelineEntryRow entry={entry} isCurrent={entry === currentEntry} parkDayId={parkDay.id} />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function TimelinePage() {
  return (
    <ErrorBoundary
      onError={(error) => console.error('Timeline error:', error)}
      fallback={(error, reset) => (
        <DashboardErrorFallback message={error.message} onRetry={reset} />
      )}
    >
      <div className="space-y-4">
        <h1 className="text-xl font-bold">Timeline</h1>
        <TimelineContent />
      </div>
    </ErrorBoundary>
  )
}
