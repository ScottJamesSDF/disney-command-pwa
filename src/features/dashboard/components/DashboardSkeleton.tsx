import { Skeleton } from '@/shared/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card'

export function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="space-y-4 md:col-span-2">
        <Card className="py-4">
          <CardHeader className="pt-0">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-64" />
          </CardHeader>
          <CardContent className="space-y-3 pb-0">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
      </div>
      <div className="space-y-4">
        <Card className="py-4">
          <CardContent className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="h-4 flex-1" />
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardHeader className="pt-0">
            <Skeleton className="h-4 w-20" />
          </CardHeader>
          <CardContent className="space-y-3 pb-0">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
