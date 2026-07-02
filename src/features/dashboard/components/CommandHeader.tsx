import { motion } from 'framer-motion'
import { ThemeToggle } from '@/app/layout/ThemeToggle'
import { formatClock } from '@/shared/lib/formatTime'
import { useClock } from '../hooks/useClock'

export function CommandHeader() {
  const now = useClock()

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <motion.span
            aria-hidden
            className="size-2 rounded-full bg-status-go"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Mission Control
          </p>
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Disney Command</h1>
      </div>
      <div className="flex items-center gap-3">
        <p className="font-mono text-lg tabular-nums text-muted-foreground">{formatClock(now)}</p>
        <ThemeToggle />
      </div>
    </div>
  )
}
