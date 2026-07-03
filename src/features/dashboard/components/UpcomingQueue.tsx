import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import type { NextCommand } from '@/domain/entities/command'
import { formatParkArea } from '@/domain/constants/parks'
import { formatMinutes } from '@/shared/lib/formatTime'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Separator } from '@/shared/components/ui/separator'

export function UpcomingQueue({ commands }: { commands: NextCommand[] }) {
  if (commands.length === 0) return null

  return (
    <Card className="py-4">
      <CardHeader className="pt-0">
        <CardTitle className="text-sm">Up Next</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pb-0">
        {commands.map((command, index) => (
          <motion.div
            key={command.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08, duration: 0.25 }}
          >
            {index > 0 && <Separator className="mb-3" />}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{command.headline}</p>
                <p className="text-xs text-muted-foreground">{command.subtext}</p>
                {command.attraction && (
                  <p className="text-[11px] text-muted-foreground/80">
                    {formatParkArea(command.attraction.park, command.attraction.area)}
                  </p>
                )}
              </div>
              {command.lightningLaneReady ? (
                <Zap className="mt-0.5 size-4 shrink-0 text-lightning-lane" />
              ) : command.waitMinutes != null ? (
                <span className="mt-0.5 shrink-0 whitespace-nowrap text-xs font-medium text-muted-foreground">
                  {formatMinutes(command.waitMinutes)}
                </span>
              ) : null}
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  )
}
