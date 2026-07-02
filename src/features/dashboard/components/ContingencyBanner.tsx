import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Zap } from 'lucide-react'
import type { Contingency } from '@/application/engines/decisionEngine'
import { formatMinutes } from '@/shared/lib/formatTime'
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert'
import { Button } from '@/shared/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet'
import { useDashboardStore } from '../dashboard.store'

export function ContingencyBanner({ contingencies }: { contingencies: Contingency[] }) {
  const sheetOpen = useDashboardStore((state) => state.contingencySheetOpen)
  const setSheetOpen = useDashboardStore((state) => state.setContingencySheetOpen)

  const primary = contingencies[0]

  return (
    <>
      <AnimatePresence>
        {primary && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <Alert variant="caution">
              <AlertTriangle />
              <AlertTitle>{primary.title}</AlertTitle>
              <AlertDescription className="flex items-center justify-between gap-3">
                <span>{primary.description}</span>
                <Button size="sm" variant="outline" onClick={() => setSheetOpen(true)}>
                  View alternatives
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[80vh]">
          <SheetHeader>
            <SheetTitle>Alternatives</SheetTitle>
            <SheetDescription>Options to consider right now.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 overflow-y-auto px-5 pb-5">
            {contingencies.map((contingency) => (
              <div key={contingency.type}>
                <p className="text-sm font-semibold">{contingency.title}</p>
                <p className="mb-2 text-xs text-muted-foreground">{contingency.description}</p>
                <div className="space-y-2">
                  {contingency.alternatives.map((alt) => (
                    <div
                      key={alt.id}
                      className="flex items-center justify-between gap-2 rounded-md border border-border bg-secondary/50 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium">{alt.headline}</p>
                        <p className="text-xs text-muted-foreground">{alt.subtext}</p>
                      </div>
                      {alt.lightningLaneReady ? (
                        <Zap className="size-4 shrink-0 text-lightning-lane" />
                      ) : alt.waitMinutes != null ? (
                        <span className="shrink-0 text-xs font-medium text-muted-foreground">
                          {formatMinutes(alt.waitMinutes)}
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
