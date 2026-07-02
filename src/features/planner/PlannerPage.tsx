import { useQuery } from '@tanstack/react-query'
import type { Family } from '@/domain/entities/family'
import type { Trip } from '@/domain/entities/trip'
import { useRepositories } from '@/shared/hooks/useRepositories'
import { queryKeys } from '@/shared/lib/queryKeys'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { TripForm } from './components/TripForm'
import { FamilyForm } from './components/FamilyForm'

function emptyTrip(familyId: string): Trip {
  const now = new Date()
  const inThreeDays = new Date(now.getTime() + 3 * 86_400_000)
  const nowIso = now.toISOString()
  return {
    id: crypto.randomUUID(),
    name: '',
    startDate: nowIso,
    endDate: inThreeDays.toISOString(),
    familyId,
    parkDays: [],
    isActive: true,
    createdAt: nowIso,
  }
}

function emptyFamily(): Family {
  return {
    id: crypto.randomUUID(),
    name: '',
    members: [],
    createdAt: new Date().toISOString(),
  }
}

export function PlannerPage() {
  const { tripRepository, familyRepository } = useRepositories()

  const tripQuery = useQuery({
    queryKey: queryKeys.trip.active(),
    queryFn: () => tripRepository.getActiveTrip(),
  })
  const familyQuery = useQuery({
    queryKey: queryKeys.family.active(),
    queryFn: () => familyRepository.getActiveFamily(),
  })

  if (tripQuery.isPending || familyQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  const family = familyQuery.data ?? emptyFamily()
  const trip = tripQuery.data ?? emptyTrip(family.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Planner</h1>
        <p className="text-sm text-muted-foreground">
          Set up your trip and family — the Dashboard's mission control reads directly from this.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trip</CardTitle>
        </CardHeader>
        <CardContent>
          <TripForm trip={trip} family={family} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Family</CardTitle>
        </CardHeader>
        <CardContent>
          <FamilyForm family={family} />
        </CardContent>
      </Card>
    </div>
  )
}
