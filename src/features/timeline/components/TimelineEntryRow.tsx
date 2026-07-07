import { PartyPopper, Ticket, Utensils } from 'lucide-react'
import type { TimelineEntry } from '@/domain/rules/timelineRules'
import { formatMinutes } from '@/shared/lib/formatTime'
import { useSetAttractionDelay } from '@/shared/hooks/useSetAttractionDelay'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/cn'

const TYPE_ICON: Record<TimelineEntry['type'], typeof Ticket> = {
  attraction: Ticket,
  dining: Utensils,
  entertainment: PartyPopper,
}

const DELAY_INCREMENTS = [5, 10, 15]

function formatEntryTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function TimelineEntryRow({
  entry,
  isCurrent,
  parkDayId,
}: {
  entry: TimelineEntry
  isCurrent: boolean
  parkDayId?: string
}) {
  const Icon = TYPE_ICON[entry.type]
  const setDelay = useSetAttractionDelay()
  const delayMinutes = entry.delayMinutes ?? 0
  const canDelay = entry.type === 'attraction' && parkDayId != null && entry.status === 'pending'

  return (
    <div
      className={cn(
        'flex gap-3 rounded-md border-l-2 py-1 pl-3',
        isCurrent ? 'border-primary bg-primary/5' : 'border-transparent',
      )}
    >
      <div className="w-16 shrink-0 pt-0.5 text-right font-mono text-xs text-muted-foreground">
        {formatEntryTime(entry.time)}
      </div>
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-sm font-medium">{entry.title}</p>
          {entry.status === 'completed' && (
            <Badge variant="success" className="text-[10px]">
              Completed
            </Badge>
          )}
          {entry.status === 'skipped' && (
            <Badge variant="outline" className="text-[10px]">
              Skipped
            </Badge>
          )}
          {isCurrent && (
            <Badge className="text-[10px]" variant="default">
              Now
            </Badge>
          )}
          {delayMinutes > 0 && (
            <Badge variant="caution" className="text-[10px]">
              Delayed +{delayMinutes} min
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{entry.subtitle}</p>
        {(entry.walkMinutes != null || entry.durationMinutes != null) && (
          <p className="text-[11px] text-muted-foreground/80">
            {entry.walkMinutes != null && `Walk ${formatMinutes(entry.walkMinutes)}`}
            {entry.walkMinutes != null && entry.durationMinutes != null && ' · '}
            {entry.durationMinutes != null && `${formatMinutes(entry.durationMinutes)} there`}
          </p>
        )}
        {entry.isEstimated && <p className="text-[10px] text-muted-foreground/60">(estimated)</p>}
        {canDelay && (
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {DELAY_INCREMENTS.map((inc) => (
              <Button
                key={inc}
                type="button"
                size="sm"
                variant="outline"
                className="h-6 px-1.5 text-[11px]"
                disabled={setDelay.isPending}
                onClick={() =>
                  setDelay.mutate({ parkDayId: parkDayId!, attractionId: entry.id, delayMinutes: delayMinutes + inc })
                }
              >
                +{inc}
              </Button>
            ))}
            {delayMinutes > 0 && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-6 px-1.5 text-[11px]"
                disabled={setDelay.isPending}
                onClick={() => setDelay.mutate({ parkDayId: parkDayId!, attractionId: entry.id, delayMinutes: 0 })}
              >
                Clear
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
