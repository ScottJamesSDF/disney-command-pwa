import { Cloud, CloudRain, CloudSun, Sun, Zap } from 'lucide-react'
import type { WeatherCondition, WeatherSnapshot } from '@/domain/entities/weather'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'

const CONDITION_ICON: Record<WeatherCondition, typeof Sun> = {
  clear: Sun,
  cloudy: CloudSun,
  rain: CloudRain,
  storm: Zap,
  other: Cloud,
}

interface WeatherWidgetProps {
  weather: WeatherSnapshot | undefined
  isPending: boolean
}

export function WeatherWidget({ weather, isPending }: WeatherWidgetProps) {
  if (isPending || !weather) {
    return (
      <Card className="py-4">
        <CardContent className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const Icon = CONDITION_ICON[weather.condition]

  return (
    <Card className="py-4">
      <CardContent className="flex items-center gap-3">
        <Icon className="size-9 text-magic-gold" />
        <div className="flex-1">
          <p className="text-lg font-semibold">
            {Math.round(weather.temperatureF)}°F{' '}
            <span className="text-sm font-normal text-muted-foreground">
              feels like {Math.round(weather.feelsLikeF)}°
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            {weather.precipitationChance}% chance of rain · {Math.round(weather.windMph)} mph wind
          </p>
        </div>
        {weather.isStale && (
          <Badge variant="caution" className="shrink-0">
            Cached
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}
