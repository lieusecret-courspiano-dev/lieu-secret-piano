'use client'

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-noir-800/60 rounded-2xl ${className}`} />
  )
}

export function SkeletonText({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-noir-800/60 rounded-lg h-4 ${className}`} />
  )
}

export function SkeletonDashboard() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-noir-800/60 animate-pulse" />
        <div className="space-y-2 flex-1">
          <SkeletonText className="w-48" />
          <SkeletonText className="w-32 h-3" />
        </div>
      </div>
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} className="h-24" />)}
      </div>
      {/* Cards skeleton */}
      <div className="grid md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} className="h-36" />)}
      </div>
    </div>
  )
}