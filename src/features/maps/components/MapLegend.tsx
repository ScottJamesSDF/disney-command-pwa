import type { Area } from '@/domain/entities/attraction'
import { AREA_NAMES } from '@/domain/constants/parks'
import { getAreaColorClass } from '../lib/areaColors'

export function MapLegend({ areas }: { areas: Area[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {areas.map((area) => (
        <div key={area} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={`size-2.5 shrink-0 rounded-full ${getAreaColorClass(area)}`} />
          {AREA_NAMES[area]}
        </div>
      ))}
    </div>
  )
}
