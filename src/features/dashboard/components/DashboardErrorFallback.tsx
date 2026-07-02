import { AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'

interface DashboardErrorFallbackProps {
  message: string
  onRetry: () => void
  action?: { label: string; to: string }
}

export function DashboardErrorFallback({ message, onRetry, action }: DashboardErrorFallbackProps) {
  return (
    <Card className="border-status-stop/40 py-8">
      <CardContent className="flex flex-col items-center gap-3 text-center">
        <AlertTriangle className="size-8 text-status-stop" />
        <p className="font-semibold">Mission Control Offline</p>
        <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
        <div className="flex gap-2">
          <Button variant={action ? 'outline' : 'default'} onClick={onRetry}>
            Retry
          </Button>
          {action && (
            <Button asChild>
              <Link to={action.to}>{action.label}</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
