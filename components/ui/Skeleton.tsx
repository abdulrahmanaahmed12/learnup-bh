import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton h-4 w-full', className)} />
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl p-5 space-y-3" style={{ background: '#500078' }}>
      <Skeleton className="h-8 w-8 rounded-full" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}
