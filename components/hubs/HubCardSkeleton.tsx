import { cn } from "@/lib/utils"

type HubCardSkeletonProps = {
  className?: string
}

export default function HubCardSkeleton({ className }: HubCardSkeletonProps) {
  return (
    <div
      className={cn(
        "group flex overflow-hidden rounded-xl border border-gray-200 bg-white",
        className
      )}
    >
      {/* Left: Image Skeleton */}
      <div className="relative h-32 w-40 flex-shrink-0 animate-pulse bg-gray-200" />

      {/* Right: Content Skeleton */}
      <div className="flex flex-1 flex-col justify-between p-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            {/* Title skeleton */}
            <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
            {/* Verified badge skeleton (sometimes visible) */}
            <div className="h-5 w-16 animate-pulse rounded bg-gray-100" />
          </div>

          {/* Location and category skeleton */}
          <div className="mt-2 flex items-center gap-2">
            <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-1 w-1 rounded-full bg-gray-300" />
            <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
          </div>

          {/* Description skeleton */}
          <div className="mt-2 space-y-1.5">
            <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-gray-200" />
          </div>
        </div>

        {/* Tags and price skeleton */}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex gap-1">
            <div className="h-5 w-12 animate-pulse rounded-full bg-gray-200" />
            <div className="h-5 w-16 animate-pulse rounded-full bg-gray-200" />
          </div>
          <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    </div>
  )
}
