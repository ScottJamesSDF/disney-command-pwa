import type { ComponentType } from 'react'
import { NavLink } from 'react-router-dom'
import {
  BarChart3,
  CheckSquare,
  Clock,
  Compass,
  MapPin,
  Sparkles,
  Trophy,
  Users,
  Utensils,
  Zap,
} from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'

interface NavEntry {
  label: string
  icon: ComponentType<{ className?: string }>
  to?: string
}

const NAV_ENTRIES: NavEntry[] = [
  { label: 'Dashboard', icon: Compass, to: '/' },
  { label: 'Timeline', icon: Clock, to: '/timeline' },
  { label: 'Maps', icon: MapPin, to: '/maps' },
  { label: "Galaxy's Edge", icon: Sparkles },
  { label: 'Planner', icon: CheckSquare, to: '/planner' },
  { label: 'Lightning Lane', icon: Zap },
  { label: 'Dining', icon: Utensils },
  { label: 'Family', icon: Users },
  { label: 'Achievements', icon: Trophy },
  { label: 'Statistics', icon: BarChart3 },
]

export function NavBar() {
  return (
    <nav className="flex items-center gap-1 overflow-x-auto">
      {NAV_ENTRIES.map((entry) => (
        <NavBarItem key={entry.label} entry={entry} />
      ))}
    </nav>
  )
}

function NavBarItem({ entry }: { entry: NavEntry }) {
  const Icon = entry.icon

  if (entry.to) {
    return (
      <NavLink
        to={entry.to}
        end
        className={({ isActive }) =>
          cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            isActive
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
          )
        }
      >
        <Icon className="size-4" />
        <span className="hidden sm:inline">{entry.label}</span>
      </NavLink>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex cursor-not-allowed items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground/50">
          <Icon className="size-4" />
          <span className="hidden sm:inline">{entry.label}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>Coming soon</TooltipContent>
    </Tooltip>
  )
}
