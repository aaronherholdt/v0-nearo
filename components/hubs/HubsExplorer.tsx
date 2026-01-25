"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"
import type { PublicHub } from "@/lib/hubs"
import LocationInput, { PickedLocation } from "@/components/location-input"
import HubCard from "@/components/hubs/HubCard"
import HubMap from "@/components/hubs/HubMap"
import HubsEmptyState from "@/components/hubs/HubsEmptyState"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

type HubsExplorerProps = {
  hubs: PublicHub[]
}

type PriceStats = {
  min: number
  max: number
}

const DEFAULT_PRICE_MIN = 0
const DEFAULT_PRICE_MAX = 1000

function toPrice(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return null
  return Math.round(value / 100)
}

function toLabel(hub: PublicHub) {
  return [hub.name, hub.city, hub.country, hub.location_full_name, hub.short_desc]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}

function derivePriceStats(hubs: PublicHub[]): PriceStats | null {
  const values = hubs
    .map((hub) => toPrice(hub.price_from_cents ?? null))
    .filter((value): value is number => typeof value === "number")

  if (values.length === 0) return null

  const min = Math.min(...values)
  const max = Math.max(...values)

  if (!Number.isFinite(min) || !Number.isFinite(max)) return null
  return { min, max }
}

export default function HubsExplorer({ hubs }: HubsExplorerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const [locationQuery, setLocationQuery] = useState("")
  const [pickedLocation, setPickedLocation] = useState<PickedLocation | null>(null)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [childrenCount, setChildrenCount] = useState<number>(0)
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null)
  const [appliedLocationQuery, setAppliedLocationQuery] = useState("")
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange | undefined>()
  const [appliedChildrenCount, setAppliedChildrenCount] = useState<number>(0)
  const [appliedPriceRange, setAppliedPriceRange] = useState<[number, number] | null>(null)
  const [activeHubId, setActiveHubId] = useState<string | number | null>(null)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [pricePopoverOpen, setPricePopoverOpen] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [isApplyingFilters, setIsApplyingFilters] = useState(false)

  const priceStats = useMemo(() => derivePriceStats(hubs), [hubs])
  const priceBounds = useMemo(
    () => ({
      min: DEFAULT_PRICE_MIN,
      max: priceStats ? Math.max(DEFAULT_PRICE_MAX, priceStats.max) : DEFAULT_PRICE_MAX,
    }),
    [priceStats]
  )
  const defaultPriceRange = useMemo<[number, number] | null>(() => {
    if (!priceStats) return null
    return [priceStats.min, priceStats.max]
  }, [priceStats])

  useEffect(() => {
    if (defaultPriceRange) {
      setPriceRange(defaultPriceRange)
      setAppliedPriceRange(defaultPriceRange)
    } else {
      setPriceRange(null)
      setAppliedPriceRange(null)
    }
  }, [defaultPriceRange])

  useEffect(() => {
    if (!priceRange) {
      setPricePopoverOpen(false)
    }
  }, [priceRange])

  useEffect(() => {
    if (!activeHubId && hubs.length > 0) {
      setActiveHubId(hubs[0].id)
    }
  }, [activeHubId, hubs])

  const normalizedLocation = appliedLocationQuery.trim().toLowerCase()

  const filteredHubs = useMemo(() => {
    return hubs
      .filter((hub) => {
        const label = toLabel(hub)
        const price = toPrice(hub.price_from_cents ?? null)

        if (normalizedLocation) {
          if (!label.includes(normalizedLocation)) {
            return false
          }
        }

        if (appliedDateRange?.from && appliedDateRange?.to) {
          const availableFrom = hub.available_from ? new Date(hub.available_from) : null
          const availableTo = hub.available_to ? new Date(hub.available_to) : null

          if (availableFrom && appliedDateRange.to < availableFrom) return false
          if (availableTo && appliedDateRange.from > availableTo) return false
        }

        if (appliedChildrenCount > 0) {
          const maxChildren =
            (hub.max_children != null && typeof hub.max_children === "number"
              ? hub.max_children
              : null)
          if (maxChildren != null && maxChildren < appliedChildrenCount) return false
        }

        if (appliedPriceRange && priceStats) {
          if (price != null) {
            if (price < appliedPriceRange[0] || price > appliedPriceRange[1]) return false
          }
        }

        if (activeTag && !(hub.tags || []).includes(activeTag)) {
          return false
        }

        return true
      })
      .sort((a, b) => {
        const priceA = toPrice(a.price_from_cents ?? null) ?? Number.POSITIVE_INFINITY
        const priceB = toPrice(b.price_from_cents ?? null) ?? Number.POSITIVE_INFINITY

        if (priceA !== priceB) return priceA - priceB
        return String(a.name).localeCompare(String(b.name))
      })
  }, [
    hubs,
    normalizedLocation,
    appliedDateRange,
    appliedChildrenCount,
    appliedPriceRange,
    priceStats,
    activeTag,
  ])

  useEffect(() => {
    if (filteredHubs.length === 0) {
      setActiveHubId(null)
      return
    }

    if (!activeHubId || !filteredHubs.some((hub) => String(hub.id) === String(activeHubId))) {
      setActiveHubId(filteredHubs[0]?.id ?? null)
    }
  }, [filteredHubs, activeHubId])

  const activeCountLabel = normalizedLocation
    ? `matching "${appliedLocationQuery.trim()}"`
    : "all hubs"

  const handleApplyFilters = () => {
    setAppliedLocationQuery(locationQuery)
    setAppliedDateRange(dateRange)
    setAppliedChildrenCount(childrenCount)
    setAppliedPriceRange(priceRange)
  }

  const handleClearLocation = () => {
    setLocationQuery("")
    setPickedLocation(null)
  }

  const handleResetFilters = () => {
    setLocationQuery("")
    setPickedLocation(null)
    setDateRange(undefined)
    setChildrenCount(0)
    setPricePopoverOpen(false)
    if (defaultPriceRange) {
      setPriceRange(defaultPriceRange)
      setAppliedPriceRange(defaultPriceRange)
    } else {
      setPriceRange(null)
      setAppliedPriceRange(null)
    }
    setAppliedLocationQuery("")
    setAppliedDateRange(undefined)
    setAppliedChildrenCount(0)
    setActiveTag(null)
  }

  const handleShowOnMap = (hubId: string | number) => {
    setActiveHubId(hubId)
    if (mapContainerRef.current) {
      mapContainerRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="sticky top-0 z-10 rounded-2xl border bg-white p-4 shadow-sm">
        <form
          className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,auto)]"
          onSubmit={(event) => {
            event.preventDefault()
            handleApplyFilters()
          }}
        >
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase text-gray-500">Location</label>
            <LocationInput
              value={locationQuery}
              onValueChange={(value) => {
                setLocationQuery(value)
                if (!value) {
                  setPickedLocation(null)
                }
              }}
              onPick={(picked) => {
                setPickedLocation(picked)
                if (picked?.fullName) {
                  setLocationQuery(picked.fullName)
                }
              }}
              placeholder="City, region or country"
            />
            {(pickedLocation || locationQuery) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="self-start text-xs text-gray-500 hover:text-emerald-600"
                onClick={handleClearLocation}
              >
                Clear location
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase text-gray-500">Dates</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-between text-left font-normal",
                    !dateRange?.from && "text-muted-foreground"
                  )}
                >
                  {dateRange?.from && dateRange?.to
                    ? `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}`
                    : "Select stay dates"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  numberOfMonths={2}
                  selected={dateRange}
                  onSelect={setDateRange}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase text-gray-500">Children</label>
            <Input
              inputMode="numeric"
              pattern="[0-9]*"
              min={0}
              type="number"
              value={childrenCount ? String(childrenCount) : ""}
              onChange={(event) => {
                const next = Number.parseInt(event.target.value, 10)
                if (Number.isNaN(next)) {
                  setChildrenCount(0)
                } else {
                  setChildrenCount(Math.max(0, next))
                }
              }}
              placeholder="Number of children"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase text-gray-500">Price per day</label>
            {priceRange && priceStats ? (
              <Popover open={pricePopoverOpen} onOpenChange={setPricePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-between text-left font-normal"
                  >
                    <span className="text-sm">
                      {priceRange[0]} - {priceRange[1]} <span className="text-gray-400">(varies by hub)</span>
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="start">
                  <div className="space-y-4 p-2">
                    <div>
                      <h4 className="mb-3 font-medium">Price per day (in each hub's currency)</h4>
                      <Slider
                        min={priceBounds.min}
                        max={priceBounds.max}
                        value={priceRange}
                        onValueChange={(value) => {
                          if (Array.isArray(value) && value.length === 2) {
                            setPriceRange([value[0], value[1]])
                          }
                        }}
                        step={5}
                        className="mb-6"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs text-gray-500">Min price (USD/THB/EUR/etc)</label>
                        <div className="relative">
                          <Input
                            type="number"
                            min={priceBounds.min}
                            max={priceRange[1]}
                            value={priceRange[0]}
                            onChange={(e) => {
                              const val = Number(e.target.value)
                              if (!isNaN(val) && val >= priceBounds.min && val <= priceRange[1]) {
                                setPriceRange([val, priceRange[1]])
                              }
                            }}
                            className="pr-8"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs text-gray-500">Max price (USD/THB/EUR/etc)</label>
                        <div className="relative">
                          <Input
                            type="number"
                            min={priceRange[0]}
                            max={priceBounds.max}
                            value={priceRange[1]}
                            onChange={(e) => {
                              const val = Number(e.target.value)
                              if (!isNaN(val) && val >= priceRange[0] && val <= priceBounds.max) {
                                setPriceRange([priceRange[0], val])
                              }
                            }}
                            className="pr-8"
                          />
                          {priceRange[1] === priceBounds.max && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">+</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (priceStats) {
                            setPriceRange([priceStats.min, priceStats.max])
                          }
                        }}
                        className="flex-1"
                      >
                        Reset
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
                        onClick={() => {
                          setPricePopoverOpen(false)
                        }}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <p className="text-xs text-gray-500">Pricing coming soon</p>
            )}
          </div>

          <div className="flex flex-col items-center gap-2">
            <Button
              type="submit"
              className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Search
            </Button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-sm text-gray-500 hover:text-emerald-600 underline"
            >
              Reset filters
            </button>
          </div>
        </form>
      </div>

      {activeTag && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3">
          <span className="text-sm text-emerald-800">
            Filtering by tag: <span className="font-medium">{activeTag}</span>
          </span>
          <button
            onClick={() => setActiveTag(null)}
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700 underline"
          >
            Clear tag filter
          </button>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing {filteredHubs.length} of {hubs.length} hubs {activeCountLabel}.
        </span>
        {filteredHubs.length === 0 && (
          <span className="text-gray-500">
            Try widening your filters to see more hubs.
          </span>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-3">
          {filteredHubs.length === 0 ? (
            <div className="rounded-xl border bg-white p-6 text-sm text-gray-500">
              No hubs match your filters yet. Adjust filters or check back soon.
            </div>
          ) : (
            filteredHubs.map((hub) => (
              <HubCard
                key={hub.id}
                hub={hub}
                isActive={String(activeHubId ?? "") === String(hub.id)}
                onPointerEnter={() => setActiveHubId(hub.id)}
                onFocus={() => setActiveHubId(hub.id)}
                onShowOnMap={() => handleShowOnMap(hub.id)}
                onTagClick={(tag) => setActiveTag(tag)}
                activeTag={activeTag}
              />
            ))
          )}
        </div>

        <div ref={mapContainerRef} className="h-[70vh] lg:sticky lg:top-28">
          <HubMap
            hubs={filteredHubs}
            selectedHubId={activeHubId}
            onSelect={(id) => setActiveHubId(id)}
          />
        </div>
      </div>
    </div>
  )
}
