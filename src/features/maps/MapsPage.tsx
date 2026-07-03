import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus } from 'lucide-react'
import type { Attraction, ParkId } from '@/domain/entities/attraction'
import { PARK_NAMES } from '@/domain/constants/parks'
import { deriveGeo } from './lib/deriveGeo'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { DashboardErrorFallback } from '@/features/dashboard/components/DashboardErrorFallback'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card'
import { useParkMap } from './hooks/useParkMap'
import { useSaveAttraction } from './hooks/useSaveAttraction'
import { MapsSkeleton } from './components/MapsSkeleton'
import { ParkMapCanvas } from './components/ParkMapCanvas'
import { MapLegend } from './components/MapLegend'
import { AttractionDetailSheet } from './components/AttractionDetailSheet'
import { AddAttractionDialog } from './components/AddAttractionDialog'

function MapsContent() {
  const { parks, attractionsByPark, defaultPark, plannedAttractionIds, isPending, isError, error } =
    useParkMap()
  const saveAttraction = useSaveAttraction()
  const queryClient = useQueryClient()
  const [selectedPark, setSelectedPark] = useState<ParkId | null>(null)
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)

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

  function handleReposition(attraction: Attraction, mapX: number, mapY: number) {
    const geo = deriveGeo(attraction.park, mapX, mapY)
    saveAttraction.mutate({ ...attraction, mapX, mapY, ...geo })
  }

  function handleToggleOpen(attraction: Attraction, isOpen: boolean) {
    saveAttraction.mutate({ ...attraction, isOpen })
    setSelectedAttraction({ ...attraction, isOpen })
  }

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
          <div className="ml-auto flex gap-2">
            {editMode && activePark && (
              <Button type="button" size="sm" variant="outline" className="gap-1" onClick={() => setAddDialogOpen(true)}>
                <Plus className="size-4" /> Add Attraction
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant={editMode ? 'default' : 'outline'}
              className="gap-1"
              onClick={() => setEditMode((prev) => !prev)}
            >
              <Pencil className="size-4" /> {editMode ? 'Done Editing' : 'Edit Layout'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pb-0">
          <MapLegend areas={areas} />
          {editMode && (
            <p className="text-xs text-muted-foreground">
              Drag a pin to reposition it — saved automatically. Tap a pin to view details or mark it
              closed.
            </p>
          )}
          {activePark ? (
            <ParkMapCanvas
              park={activePark}
              attractions={attractions}
              plannedAttractionIds={plannedAttractionIds}
              editMode={editMode}
              onSelect={setSelectedAttraction}
              onReposition={handleReposition}
            />
          ) : (
            <p className="text-sm text-muted-foreground">No park data available.</p>
          )}
        </CardContent>
      </Card>

      <AttractionDetailSheet
        attraction={selectedAttraction}
        editMode={editMode}
        onClose={() => setSelectedAttraction(null)}
        onToggleOpen={handleToggleOpen}
      />

      {addDialogOpen && activePark && (
        <AddAttractionDialog
          park={activePark}
          areas={areas}
          onClose={() => setAddDialogOpen(false)}
          onCreate={(attraction) => {
            saveAttraction.mutate(attraction)
            setAddDialogOpen(false)
          }}
        />
      )}
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
