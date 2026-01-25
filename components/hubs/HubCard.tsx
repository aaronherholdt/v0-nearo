import type { PublicHub } from "@/lib/hubs"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { formatHubPrice } from "@/components/hubs/utils"
import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

type HubCardProps = {
  hub: PublicHub
  isActive?: boolean
  onPointerEnter?: () => void
  onPointerLeave?: () => void
  onFocus?: () => void
  onShowOnMap?: () => void
  onTagClick?: (tag: string) => void
  activeTag?: string | null
}

function formatAvailability(from: string | null | undefined, to: string | null | undefined): string | null {
  if (!from && !to) return null
  
  try {
    if (from && to) {
      const fromDate = new Date(from)
      const toDate = new Date(to)
      const fromYear = fromDate.getFullYear()
      const toYear = toDate.getFullYear()
      
      // If same year, don't repeat it
      if (fromYear === toYear) {
        return `Available: ${format(fromDate, "MMM")}–${format(toDate, "MMM yyyy")}`
      } else {
        return `Available: ${format(fromDate, "MMM yyyy")}–${format(toDate, "MMM yyyy")}`
      }
    } else if (from) {
      const fromDate = new Date(from)
      return `Available from ${format(fromDate, "MMM yyyy")}`
    }
  } catch {
    return null
  }
  
  return null
}

export default function HubCard({
  hub,
  isActive = false,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onShowOnMap,
  onTagClick,
  activeTag,
}: HubCardProps) {
  const price = formatHubPrice(hub)
  const locationLabel = [hub.city, hub.country].filter(Boolean).join(", ")
  const availability = formatAvailability(hub.available_from, hub.available_to)

  const images = useMemo(() => {
    const list = []
    if (hub.hero_image_url) list.push(hub.hero_image_url)
    if (hub.gallery_urls?.length) list.push(...hub.gallery_urls)
    return list
  }, [hub.hero_image_url, hub.gallery_urls])

  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const currentImage = images[currentImageIndex]

  return (
    <div
      className={cn(
        "group relative flex overflow-hidden rounded-xl border bg-white transition hover:shadow-md",
        isActive ? "border-emerald-400 shadow-md ring-2 ring-emerald-100" : "border-gray-200"
      )}
      onMouseEnter={onPointerEnter}
      onMouseLeave={onPointerLeave}
      onFocusCapture={onFocus}
    >
      {/* Left: Image Carousel */}
      <div className="relative h-32 w-40 flex-shrink-0 bg-gray-100 group/carousel">
        {currentImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentImage}
            alt={hub.name}
            className="h-full w-full object-cover"
          />
        )}

        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover/carousel:opacity-100 focus:opacity-100 focus:outline-none"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover/carousel:opacity-100 focus:opacity-100 focus:outline-none"
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            
            {/* Dots Indicator */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
              {images.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full shadow-sm transition-all",
                    idx === currentImageIndex ? "bg-white scale-110" : "bg-white/50"
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Right: Content */}
      <div className="flex flex-1 flex-col justify-between p-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight">{hub.name}</h3>
            {hub.verified && (
              <span className="flex-shrink-0 rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                Verified
              </span>
            )}
          </div>

          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
            {locationLabel && <span>{locationLabel}</span>}
            {hub.category && locationLabel && <span>•</span>}
            {hub.category && (
              <span className="uppercase tracking-wide">{hub.category}</span>
            )}
          </div>

          {(hub.min_age != null || hub.max_age != null || hub.max_children != null) && (
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
              {(hub.min_age != null || hub.max_age != null) && (
                <span>
                  Ages {hub.min_age ?? 0}–{hub.max_age ?? 18}
                </span>
              )}
              {(hub.min_age != null || hub.max_age != null) && hub.max_children != null && <span>•</span>}
              {hub.max_children != null && (
                <span>Up to {hub.max_children} children</span>
              )}
            </div>
          )}

          {availability && (
            <div className="mt-1 text-xs text-gray-500">
              {availability}
            </div>
          )}

          {hub.short_desc && (
            <p className="mt-1.5 line-clamp-2 text-sm text-gray-600">{hub.short_desc}</p>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between">
          {hub.tags?.length ? (
            <div className="flex flex-wrap gap-1 mr-2">
              {hub.tags.slice(0, 2).map((t: string) => (
                <button
                  key={t}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onTagClick?.(t)
                  }}
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[11px] transition-colors",
                    "hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-1",
                    activeTag === t
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 text-gray-600"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-3">
            {hub.website_url && (
              <a
                href={hub.website_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-emerald-600 hover:text-emerald-700 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-1 rounded"
              >
                Visit site ↗
              </a>
            )}
            {price && <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">{price}</p>}
            
            {onShowOnMap && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onShowOnMap()
                }}
                className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white shadow-sm hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-1 whitespace-nowrap"
                aria-label="Show on map"
              >
                Show on map
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
