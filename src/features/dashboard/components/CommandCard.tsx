import { motion } from 'framer-motion'
import { Check, SkipForward, Zap } from 'lucide-react'
import type { NextCommand } from '@/domain/entities/command'
import { formatParkArea } from '@/domain/constants/parks'
import { cn } from '@/shared/lib/cn'
import { formatMinutes } from '@/shared/lib/formatTime'
import { useSetAttractionDelay } from '@/shared/hooks/useSetAttractionDelay'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card'
import { useCompleteCommand } from '../hooks/useCompleteCommand'
import { useDashboardStore } from '../dashboard.store'

const DELAY_INCREMENTS = [5, 10, 15]

const PRIORITY_STYLES: Record<NextCommand['priority'], { bar: string; label: string }> = {
  critical: { bar: 'bg-castle-red', label: 'text-castle-red' },
  high: { bar: 'bg-ember-orange', label: 'text-ember-orange' },
  normal: { bar: 'bg-primary', label: 'text-primary' },
  low: { bar: 'bg-muted-foreground', label: 'text-muted-foreground' },
}

function waitColor(waitMinutes: number | undefined): string {
  if (waitMinutes == null) return 'text-muted-foreground'
  if (waitMinutes <= 15) return 'text-status-go'
  if (waitMinutes <= 30) return 'text-status-caution'
  return 'text-status-stop'
}

export function CommandCard({
  command,
  parkDayId,
  delayMinutes = 0,
}: {
  command: NextCommand
  parkDayId?: string
  delayMinutes?: number
}) {
  const { completeCommand, skipCommand, isPending } = useCompleteCommand()
  const setDelay = useSetAttractionDelay()
  const optimisticCommandIds = useDashboardStore((state) => state.optimisticCommandIds)
  const isOptimisticallyResolved = optimisticCommandIds.has(command.id)
  const style = PRIORITY_STYLES[command.priority]

  function addDelay(minutes: number) {
    if (!parkDayId || !command.attraction) return
    setDelay.mutate({ parkDayId, attractionId: command.attraction.id, delayMinutes: delayMinutes + minutes })
  }

  function clearDelay() {
    if (!parkDayId || !command.attraction) return
    setDelay.mutate({ parkDayId, attractionId: command.attraction.id, delayMinutes: 0 })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={cn(
          'overflow-hidden border-2 py-0',
          command.lightningLaneReady ? 'border-lightning-lane-ready' : 'border-transparent',
        )}
      >
        <div className={cn('h-1.5 w-full', style.bar)} />
        <CardHeader className="pt-4">
          <div className="flex items-center justify-between gap-2">
            <span className={cn('text-xs font-bold uppercase tracking-wider', style.label)}>
              {command.priority === 'critical' && (
                <motion.span
                  aria-hidden
                  className="mr-1.5 inline-block size-1.5 rounded-full bg-castle-red align-middle"
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
              {command.priority} · {command.type.replace(/([A-Z])/g, ' $1').trim()}
            </span>
            {command.lightningLaneReady && (
              <Badge className="gap-1 border-transparent bg-lightning-lane text-white">
                <Zap className="size-3" />
                Lightning Lane
              </Badge>
            )}
          </div>
          <h2 className="text-xl font-bold sm:text-2xl">{command.headline}</h2>
          <p className="text-sm text-muted-foreground">{command.subtext}</p>
          {command.attraction && (
            <p className="text-xs text-muted-foreground/80">
              {formatParkArea(command.attraction.park, command.attraction.area)}
            </p>
          )}
        </CardHeader>
        <CardContent className="pb-5">
          <div className="grid grid-cols-3 gap-3 rounded-lg bg-secondary/60 p-3 text-center">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Walk
              </p>
              <p className="font-mono text-lg font-semibold">{formatMinutes(command.walkMinutes)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Wait
              </p>
              <p className={cn('font-mono text-lg font-semibold', waitColor(command.waitMinutes))}>
                {command.waitMinutes != null ? formatMinutes(command.waitMinutes) : '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Duration
              </p>
              <p className="font-mono text-lg font-semibold">
                {command.durationMinutes != null ? formatMinutes(command.durationMinutes) : '—'}
              </p>
            </div>
          </div>

          {command.estimatedCompletion && (
            <p className="mt-3 text-xs text-muted-foreground">
              Estimated completion:{' '}
              <span className="font-medium text-foreground">
                {new Date(command.estimatedCompletion).toLocaleTimeString(undefined, {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            </p>
          )}

          {command.attraction && (
            <div className="mt-4 flex gap-2">
              <Button
                onClick={() => completeCommand(command)}
                disabled={isPending || isOptimisticallyResolved}
                className="flex-1 gap-1.5"
              >
                <Check className="size-4" />
                {isOptimisticallyResolved ? 'Done!' : 'Complete'}
              </Button>
              <Button
                variant="outline"
                onClick={() => skipCommand(command)}
                disabled={isPending || isOptimisticallyResolved}
                className="gap-1.5"
              >
                <SkipForward className="size-4" />
                Skip
              </Button>
            </div>
          )}

          {command.attraction && parkDayId && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {delayMinutes > 0 && <Badge variant="caution">Delayed +{delayMinutes} min</Badge>}
              {DELAY_INCREMENTS.map((inc) => (
                <Button
                  key={inc}
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={setDelay.isPending}
                  onClick={() => addDelay(inc)}
                >
                  +{inc}
                </Button>
              ))}
              {delayMinutes > 0 && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={setDelay.isPending}
                  onClick={clearDelay}
                >
                  Clear delay
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
