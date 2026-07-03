import { Link } from 'react-router-dom'
import { Ruler, Zap } from 'lucide-react'
import { type Attraction, isHighWait, isMediumWait } from '@/domain/entities/attraction'
import { formatParkArea } from '@/domain/constants/parks'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet'

function waitBadgeVariant(attraction: Attraction): 'destructive' | 'caution' | 'success' {
  if (isHighWait(attraction)) return 'destructive'
  if (isMediumWait(attraction)) return 'caution'
  return 'success'
}

export function AttractionDetailSheet({
  attraction,
  onClose,
}: {
  attraction: Attraction | null
  onClose: () => void
}) {
  return (
    <Sheet open={attraction != null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="max-h-[80vh]">
        {attraction && (
          <>
            <SheetHeader>
              <SheetTitle>{attraction.name}</SheetTitle>
              <p className="text-sm text-muted-foreground">
                {formatParkArea(attraction.park, attraction.area)}
              </p>
            </SheetHeader>
            <div className="space-y-3 overflow-y-auto px-5 pb-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={waitBadgeVariant(attraction)}>
                  {attraction.currentWaitMinutes} min wait
                </Badge>
                {attraction.hasLightningLane && (
                  <Badge className="gap-1 border-transparent bg-lightning-lane text-white">
                    <Zap className="size-3" />
                    {attraction.lightningLaneAvailable ? 'Lightning Lane available' : 'Lightning Lane'}
                  </Badge>
                )}
                <Badge variant="outline">Thrill {attraction.thrillLevel}/5</Badge>
              </div>

              {attraction.heightRequirement && (
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Ruler className="size-4" />
                  {attraction.heightRequirement}
                </p>
              )}

              <p className="text-sm text-muted-foreground">{attraction.description}</p>

              {attraction.photoTip && (
                <p className="rounded-md bg-secondary/50 p-2 text-xs text-muted-foreground">
                  📷 {attraction.photoTip}
                </p>
              )}

              <Button asChild className="w-full">
                <Link to="/planner">Plan this attraction</Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
