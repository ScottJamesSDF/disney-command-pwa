import { Check } from 'lucide-react'
import type { Attraction } from '@/domain/entities/attraction'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { cn } from '@/shared/lib/cn'
import { getAreaColorClass } from '../lib/areaColors'

export function ParkMapCanvas({
  attractions,
  plannedAttractionIds,
  onSelect,
}: {
  attractions: Attraction[]
  plannedAttractionIds: Set<string>
  onSelect: (attraction: Attraction) => void
}) {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-border bg-secondary/30">
      {attractions.map((attraction) => {
        const isPlanned = plannedAttractionIds.has(attraction.id)
        return (
          <Tooltip key={attraction.id}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onSelect(attraction)}
                aria-label={attraction.name}
                className="absolute flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                style={{ left: `${attraction.mapX * 100}%`, top: `${attraction.mapY * 100}%` }}
              >
                <span
                  className={cn(
                    'size-3 rounded-full ring-2 ring-background transition-transform hover:scale-125',
                    getAreaColorClass(attraction.area),
                  )}
                />
                {isPlanned && (
                  <Check className="absolute size-3 text-white drop-shadow" strokeWidth={3} />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>{attraction.name}</TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}
