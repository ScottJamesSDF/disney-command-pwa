import { Skeleton } from '@/shared/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card'

export function MapsSkeleton() {
  return (
    <Card className="py-4">
      <CardHeader className="flex-row items-center gap-2 pt-0">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-40" />
      </CardHeader>
      <CardContent className="pb-0">
        <Skeleton className="aspect-[4/3] w-full rounded-lg" />
      </CardContent>
    </Card>
  )
}
