import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus'
import { Badge } from '@/shared/components/ui/badge'

export function OfflineIndicator() {
  const isOnline = useOnlineStatus()
  if (isOnline) return null

  return (
    <Badge variant="caution" className="gap-1.5">
      <WifiOff className="size-3" />
      Offline — showing last known data
    </Badge>
  )
}
