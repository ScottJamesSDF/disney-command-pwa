import { Zap } from 'lucide-react'
import type { Attraction } from '@/domain/entities/attraction'
import { formatCountdown } from '@/shared/lib/formatTime'
import { Badge } from '@/shared/components/ui/badge'
import { useClock } from '../hooks/useClock'

export function LightningLaneCountdown({ attraction }: { attraction: Attraction | null }) {
  const now = useClock()

  if (!attraction?.lightningLaneReturnTime) return null

  const returnTime = new Date(attraction.lightningLaneReturnTime)
  const isOpenNow = returnTime.getTime() <= now.getTime()

  return (
    <Badge variant={isOpenNow ? 'success' : 'outline'} className="gap-1.5 py-1">
      <Zap className="size-3" />
      {isOpenNow
        ? `${attraction.name} Lightning Lane is open`
        : `${attraction.name} LL opens in ${formatCountdown(attraction.lightningLaneReturnTime, now)}`}
    </Badge>
  )
}
