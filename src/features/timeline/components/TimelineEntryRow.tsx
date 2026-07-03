import { PartyPopper, Ticket, Utensils } from 'lucide-react'
import type { TimelineEntry } from '@/domain/rules/timelineRules'
import { formatMinutes } from '@/shared/lib/formatTime'
import { Badge } from '@/shared/components/ui/badge'
import { cn } from '@/shared/lib/cn'

const TYPE_ICON: Record<TimelineEntry['type'], typeof Ticket> = {
  attraction: Ticket,
  dining: Utensils,
  entertainment: PartyPopper,
}

function formatEntryTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function TimelineEntryRow({ entry, isCurrent }: { entry: TimelineEntry; isCurrent: boolean }) {
  const Icon = TYPE_ICON[entry.type]

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
      </div>
    </div>
  )
}
