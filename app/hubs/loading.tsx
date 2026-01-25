import HubCardSkeleton from "@/components/hubs/HubCardSkeleton"
import IconPageShell from "@/components/icon-page-shell"

export default function HubsLoading() {
  return (
    <IconPageShell contentClassName="flex flex-col">
      <main className="mx-auto max-w-7xl space-y-6 p-4 w-full">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />
            <h1 className="text-xl font-semibold">Hubs</h1>
          </div>
          <div className="h-9 w-28 animate-pulse rounded-lg bg-gray-200" />
        </div>

        {/* Filter bar skeleton */}
        <div className="sticky top-0 z-10 rounded-2xl border bg-white p-4 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,auto)]">
            {/* Location skeleton */}
            <div className="flex flex-col gap-2">
              <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
              <div className="h-10 w-full animate-pulse rounded-md border bg-gray-50" />
            </div>

            {/* Dates skeleton */}
            <div className="flex flex-col gap-2">
              <div className="h-3 w-12 animate-pulse rounded bg-gray-200" />
              <div className="h-10 w-full animate-pulse rounded-md border bg-gray-50" />
            </div>

            {/* Children skeleton */}
            <div className="flex flex-col gap-2">
              <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
              <div className="h-10 w-full animate-pulse rounded-md border bg-gray-50" />
            </div>

            {/* Price range skeleton */}
            <div className="flex flex-col gap-2">
              <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
              <div className="h-10 w-full animate-pulse rounded-md border bg-gray-50" />
            </div>

            {/* Search button skeleton */}
            <div className="flex flex-col items-center gap-2">
              <div className="h-10 w-full animate-pulse rounded-md bg-gray-200" />
              <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
        </div>

        {/* Results count skeleton */}
        <div className="flex items-center justify-between text-sm">
          <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
        </div>

        {/* Grid with skeleton cards and map */}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          {/* Skeleton cards */}
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <HubCardSkeleton key={i} />
            ))}
          </div>

          {/* Map skeleton */}
          <div className="h-[70vh] lg:sticky lg:top-28">
            <div className="relative h-full w-full rounded-xl border bg-white">
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-500">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-12 w-12 animate-pulse rounded-full bg-gray-200" />
                  <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </IconPageShell>
  )
}
