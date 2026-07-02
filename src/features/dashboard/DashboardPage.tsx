import { useQueryClient } from '@tanstack/react-query'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { CommandHeader } from './components/CommandHeader'
import { DayProgressBar } from './components/DayProgressBar'
import { ContingencyBanner } from './components/ContingencyBanner'
import { CommandCard } from './components/CommandCard'
import { LightningLaneCountdown } from './components/LightningLaneCountdown'
import { UpcomingQueue } from './components/UpcomingQueue'
import { FamilyStatusBar } from './components/FamilyStatusBar'
import { WeatherWidget } from './components/WeatherWidget'
import { DashboardSkeleton } from './components/DashboardSkeleton'
import { DashboardErrorFallback } from './components/DashboardErrorFallback'
import { useCommandQueue } from './hooks/useCommandQueue'
import { useContingencies } from './hooks/useContingencies'
import { useWeather } from './hooks/useWeather'
import { useDashboardNotifications } from './hooks/useDashboardNotifications'

function DashboardContent() {
  const { queue, parkDay, family, isPending, isError, error } = useCommandQueue()
  const contingencies = useContingencies()
  const weather = useWeather()
  const queryClient = useQueryClient()

  useDashboardNotifications(queue)

  if (isPending) return <DashboardSkeleton />

  if (isError) {
    return (
      <DashboardErrorFallback
        message={error instanceof Error ? error.message : 'Something went wrong loading your day.'}
        onRetry={() => void queryClient.invalidateQueries()}
      />
    )
  }

  if (!queue || !parkDay || !family) {
    return (
      <DashboardErrorFallback
        message="No active trip found for today. Start a trip in the Planner to see your mission."
        onRetry={() => void queryClient.invalidateQueries()}
      />
    )
  }

  return (
    <div className="space-y-4">
      <CommandHeader />
      <DayProgressBar parkDay={parkDay} />
      <ContingencyBanner contingencies={contingencies} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <div className="space-y-3 md:col-span-2">
          <LightningLaneCountdown attraction={queue.current.attraction} />
          <CommandCard command={queue.current} />
        </div>

        <div className="space-y-4">
          <WeatherWidget weather={weather.data} isPending={weather.isPending} />
          <FamilyStatusBar family={family} />
        </div>

        <div className="md:col-span-3 lg:col-span-1">
          <UpcomingQueue commands={queue.upcoming} />
        </div>
      </div>
    </div>
  )
}

export function DashboardPage() {
  return (
    <ErrorBoundary
      onError={(error) => console.error('Dashboard error:', error)}
      fallback={(error, reset) => (
        <DashboardErrorFallback message={error.message} onRetry={reset} />
      )}
    >
      <DashboardContent />
    </ErrorBoundary>
  )
}
