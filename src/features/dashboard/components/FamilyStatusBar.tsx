import { Droplet } from 'lucide-react'
import type { EnergyLevel, Family } from '@/domain/entities/family'
import { groupEnergyLevel, needsHydration } from '@/domain/rules/familyRules'
import { cn } from '@/shared/lib/cn'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'

const ENERGY_STYLES: Record<EnergyLevel, { label: string; badge: string; bar: string }> = {
  high: { label: 'High Energy', badge: 'success', bar: 'bg-status-go' },
  medium: { label: 'Medium Energy', badge: 'outline', bar: 'bg-bright-blue' },
  low: { label: 'Low Energy', badge: 'caution', bar: 'bg-status-caution' },
  exhausted: { label: 'Exhausted', badge: 'destructive', bar: 'bg-status-stop' },
}

const ENERGY_FRACTION: Record<EnergyLevel, number> = {
  high: 1,
  medium: 0.66,
  low: 0.33,
  exhausted: 0.1,
}

export function FamilyStatusBar({ family }: { family: Family }) {
  const now = new Date()
  const groupEnergy = groupEnergyLevel(family)
  const groupStyle = ENERGY_STYLES[groupEnergy]

  return (
    <Card className="py-4">
      <CardHeader className="flex-row items-center justify-between pt-0">
        <CardTitle className="text-sm">{family.name}</CardTitle>
        <Badge variant={groupStyle.badge as 'success' | 'outline' | 'caution' | 'destructive'}>
          {groupStyle.label}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3 pb-0">
        {family.members.map((member) => {
          const style = ENERGY_STYLES[member.energyLevel]
          const thirsty = needsHydration(member, now)
          return (
            <div key={member.id} className="flex items-center gap-3">
              <Avatar className="size-8">
                <AvatarFallback>{member.avatarEmoji ?? member.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium">{member.name}</p>
                  {thirsty && <Droplet className="size-3.5 text-lightning-lane" />}
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn('h-full rounded-full', style.bar)}
                    style={{ width: `${ENERGY_FRACTION[member.energyLevel] * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
