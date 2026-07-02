import { Trash2 } from 'lucide-react'
import type { ParkDay } from '@/domain/entities/trip'
import { PARK_NAMES } from '@/domain/constants/parks'
import { Button } from '@/shared/components/ui/button'

interface ParkDaySummaryRowProps {
  parkDay: ParkDay
  onEdit: () => void
  onRemove: () => void
}

export function ParkDaySummaryRow({ parkDay, onEdit, onRemove }: ParkDaySummaryRowProps) {
  const date = new Date(parkDay.date).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-secondary/40 px-3 py-2">
      <div>
        <p className="text-sm font-medium">
          {date} · {PARK_NAMES[parkDay.park]}
        </p>
        <p className="text-xs text-muted-foreground">
          {parkDay.plannedAttractions.length} attractions · {parkDay.diningReservations.length}{' '}
          dining · {parkDay.entertainment.length} entertainment
        </p>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button type="button" variant="outline" size="sm" onClick={onEdit}>
          Edit
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label="Remove park day">
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  )
}
