import { Skeleton } from '@/shared/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card'

export function TimelineSkeleton() {
  return (
    <Card className="py-4">
      <CardHeader className="pt-0">
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-4 pb-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-4 w-14 shrink-0" />
            <Skeleton className="h-10 flex-1 rounded-md" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
