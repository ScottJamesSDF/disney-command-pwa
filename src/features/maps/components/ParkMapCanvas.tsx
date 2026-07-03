import { useRef, useState } from 'react'
import { Check, X } from 'lucide-react'
import type { Attraction, ParkId } from '@/domain/entities/attraction'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { cn } from '@/shared/lib/cn'
import { getAreaColorClass } from '../lib/areaColors'

const DRAG_THRESHOLD_PX = 5

export function ParkMapCanvas({
  park,
  attractions,
  plannedAttractionIds,
  editMode,
  onSelect,
  onReposition,
}: {
  park: ParkId
  attractions: Attraction[]
  plannedAttractionIds: Set<string>
  editMode: boolean
  onSelect: (attraction: Attraction) => void
  onReposition: (attraction: Attraction, mapX: number, mapY: number) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const suppressClickRef = useRef(false)
  const [imageFailed, setImageFailed] = useState(false)
  const [drag, setDrag] = useState<{ id: string; mapX: number; mapY: number } | null>(null)

  function relativePosition(clientX: number, clientY: number) {
    const rect = containerRef.current!.getBoundingClientRect()
    return {
      x: Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)),
    }
  }

  function handlePointerDown(e: React.PointerEvent, attraction: Attraction) {
    if (!editMode) return
    const startX = e.clientX
    const startY = e.clientY
    let moved = false

    function handleMove(ev: PointerEvent) {
      if (!moved && Math.hypot(ev.clientX - startX, ev.clientY - startY) > DRAG_THRESHOLD_PX) {
        moved = true
      }
      const { x, y } = relativePosition(ev.clientX, ev.clientY)
      setDrag({ id: attraction.id, mapX: x, mapY: y })
    }
    function handleUp(ev: PointerEvent) {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      if (moved) {
        suppressClickRef.current = true
        const { x, y } = relativePosition(ev.clientX, ev.clientY)
        onReposition(attraction, x, y)
      }
      setDrag(null)
    }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  }

  function handleClick(attraction: Attraction) {
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }
    onSelect(attraction)
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full overflow-hidden rounded-lg border border-border bg-secondary/30',
        imageFailed && 'aspect-[4/3]',
      )}
    >
      <img
        src={`/maps/${park}.jpg`}
        alt=""
        draggable={false}
        className={cn('block w-full', imageFailed ? 'hidden' : 'h-auto')}
        onError={() => setImageFailed(true)}
      />
      <div className="absolute inset-0">
        {attractions.map((attraction) => {
          const isPlanned = plannedAttractionIds.has(attraction.id)
          const isDragging = drag?.id === attraction.id
          const mapX = isDragging ? drag.mapX : attraction.mapX
          const mapY = isDragging ? drag.mapY : attraction.mapY
          return (
            <Tooltip key={attraction.id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onPointerDown={(e) => handlePointerDown(e, attraction)}
                  onClick={() => handleClick(attraction)}
                  aria-label={attraction.name}
                  className={cn(
                    'absolute flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center',
                    editMode && 'cursor-grab active:cursor-grabbing',
                  )}
                  style={{ left: `${mapX * 100}%`, top: `${mapY * 100}%` }}
                >
                  <span
                    className={cn(
                      'size-3 rounded-full ring-2 ring-background transition-transform hover:scale-125',
                      attraction.isOpen ? getAreaColorClass(attraction.area) : 'bg-muted-foreground/40',
                    )}
                  />
                  {isPlanned && (
                    <Check className="absolute size-3 text-white drop-shadow" strokeWidth={3} />
                  )}
                  {!attraction.isOpen && (
                    <X className="absolute size-3 text-white drop-shadow" strokeWidth={3} />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>{attraction.name}</TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </div>
  )
}
