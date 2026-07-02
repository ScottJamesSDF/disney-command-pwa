import type { ParkDay } from '@/domain/entities/trip'
import { completedAttractions, completionPercent } from '@/domain/rules/tripRules'
import { Progress } from '@/shared/components/ui/progress'

export function DayProgressBar({ parkDay }: { parkDay: ParkDay }) {
  const total = parkDay.plannedAttractions.length
  if (total === 0) return null

  const completed = completedAttractions(parkDay)
  const percent = Math.round(completionPercent(parkDay) * 100)

  return (
    <div className="flex items-center gap-3">
      <Progress value={percent} className="h-1.5 flex-1" />
      <p className="whitespace-nowrap text-xs font-medium text-muted-foreground">
        {completed} / {total} attractions · {percent}%
      </p>
    </div>
  )
}
