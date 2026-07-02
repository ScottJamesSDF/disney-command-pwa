import { AlertTriangle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'

export function DashboardErrorFallback({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card className="border-status-stop/40 py-8">
      <CardContent className="flex flex-col items-center gap-3 text-center">
        <AlertTriangle className="size-8 text-status-stop" />
        <p className="font-semibold">Mission Control Offline</p>
        <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
        <Button onClick={onRetry}>Retry</Button>
      </CardContent>
    </Card>
  )
}
