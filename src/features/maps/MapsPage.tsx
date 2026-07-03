import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Attraction, ParkId } from '@/domain/entities/attraction'
import { PARK_NAMES } from '@/domain/constants/parks'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { DashboardErrorFallback } from '@/features/dashboard/components/DashboardErrorFallback'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card'
import { useParkMap } from './hooks/useParkMap'
import { MapsSkeleton } from './components/MapsSkeleton'
import { ParkMapCanvas } from './components/ParkMapCanvas'
import { MapLegend } from './components/MapLegend'
import { AttractionDetailSheet } from './components/AttractionDetailSheet'

function MapsContent() {
  const { parks, attractionsByPark, defaultPark, plannedAttractionIds, isPending, isError, error } =
    useParkMap()
  const queryClient = useQueryClient()
  const [selectedPark, setSelectedPark] = useState<ParkId | null>(null)
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null)

  if (isPending) return <MapsSkeleton />

  if (isError) {
    return (
      <DashboardErrorFallback
        message={error instanceof Error ? error.message : 'Something went wrong loading the map.'}
        onRetry={() => void queryClient.invalidateQueries()}
      />
    )
  }

  const activePark = selectedPark ?? defaultPark ?? parks[0] ?? null
  const attractions = activePark ? (attractionsByPark.get(activePark) ?? []) : []
  const areas = [...new Set(attractions.map((a) => a.area))]

  return (
    <>
      <Card className="py-4">
        <CardHeader className="flex-row flex-wrap items-center gap-2 pt-0">
          {parks.map((park) => (
            <Button
              key={park}
              type="button"
              size="sm"
              variant={park === activePark ? 'default' : 'outline'}
              onClick={() => setSelectedPark(park)}
            >
              {PARK_NAMES[park]}
            </Button>
          ))}
        </CardHeader>
        <CardContent className="space-y-3 pb-0">
          <MapLegend areas={areas} />
          {activePark ? (
            <ParkMapCanvas
              attractions={attractions}
              plannedAttractionIds={plannedAttractionIds}
              onSelect={setSelectedAttraction}
            />
          ) : (
            <p className="text-sm text-muted-foreground">No park data available.</p>
          )}
        </CardContent>
      </Card>

      <AttractionDetailSheet attraction={selectedAttraction} onClose={() => setSelectedAttraction(null)} />
    </>
  )
}

export function MapsPage() {
  return (
    <ErrorBoundary
      onError={(error) => console.error('Maps error:', error)}
      fallback={(error, reset) => <DashboardErrorFallback message={error.message} onRetry={reset} />}
    >
      <div className="space-y-4">
        <h1 className="text-xl font-bold">Maps</h1>
        <MapsContent />
      </div>
    </ErrorBoundary>
  )
}
