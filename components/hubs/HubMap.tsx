"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { LatLngExpression, LayerGroup, Map as LeafletMap, Marker } from "leaflet"
import type { PublicHub } from "@/lib/hubs"
import { formatHubPrice } from "@/components/hubs/utils"

let leafletLib: typeof import("leaflet") | null = null
let markerClusterLib: typeof import("leaflet.markercluster") | null = null

type HubMapProps = {
  hubs: PublicHub[]
  selectedHubId?: string | number | null
  onSelect?: (hubId: string | number) => void
}

type HubPoint = {
  id: string
  hub: PublicHub
  label: string
  locationLabel: string
  priceLabel: string | null
  lat: number
  lng: number
}

function escapeHtml(value: string | null | undefined): string {
  if (!value) return ""
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;"
      case "<":
        return "&lt;"
      case ">":
        return "&gt;"
      case '"':
        return "&quot;"
      case "'":
        return "&#39;"
      default:
        return char
    }
  })
}

function createTooltipHtml(point: HubPoint): string {
  const { hub, locationLabel, priceLabel } = point
  const title = escapeHtml(hub.name)
  const location = escapeHtml(locationLabel)
  const description = escapeHtml(hub.short_desc)
  const price = escapeHtml(priceLabel)
  const imageUrl = escapeHtml(hub.hero_image_url ?? "")

  return `
    <div class="hub-tooltip-card">
      ${
        imageUrl
          ? `<div class="hub-tooltip-card__media"><img src="${imageUrl}" alt="${title}" /></div>`
          : ""
      }
      <div class="hub-tooltip-card__body">
        <div class="hub-tooltip-card__title">${title}</div>
        ${location ? `<div class="hub-tooltip-card__location">${location}</div>` : ""}
        ${description ? `<div class="hub-tooltip-card__description">${description}</div>` : ""}
        ${price ? `<div class="hub-tooltip-card__price">${price}</div>` : ""}
      </div>
    </div>
  `
}

type MarkerIconState = {
  isActive?: boolean
  animate?: boolean
}

function createMarkerIcon(
  point: HubPoint,
  state: MarkerIconState = {},
  leaflet: typeof import("leaflet")
) {
  const { isActive = false, animate = false } = state
  const priceText = escapeHtml(point.priceLabel ?? "View hub")
  const classes = ["hub-marker"]

  if (!point.priceLabel) {
    classes.push("hub-marker--no-price")
  }
  if (isActive) {
    classes.push("hub-marker--active")
  }
  if (animate) {
    classes.push("hub-marker--pop")
  }

  const html = `<div class="hub-marker-anchor"><div class="${classes.join(
    " "
  )}"><span class="hub-marker__price">${priceText}</span></div></div>`

  return leaflet.divIcon({
    html,
    className: "hub-marker-wrapper",
  })
}

function getHubCoordinates(hub: PublicHub): { lat: number; lng: number } | null {
  const latCandidate =
    hub.location_lat ?? (hub as Record<string, unknown>)?.lat ?? (hub as Record<string, unknown>)?.latitude
  const lngCandidate =
    hub.location_lng ?? (hub as Record<string, unknown>)?.lng ?? (hub as Record<string, unknown>)?.longitude

  if (typeof latCandidate === "number" && typeof lngCandidate === "number") {
    return { lat: latCandidate, lng: lngCandidate }
  }

  return null
}

async function ensureLeafletLoaded() {
  if (leafletLib && markerClusterLib) return leafletLib

  try {
    const mod = await import("leaflet")
    await import("leaflet/dist/leaflet.css")
    leafletLib = (mod.default ?? mod) as typeof import("leaflet")

    // Load marker cluster plugin
    await import("leaflet.markercluster")
    await import("leaflet.markercluster/dist/MarkerCluster.css")
    await import("leaflet.markercluster/dist/MarkerCluster.Default.css")
    markerClusterLib = true as any // Plugin extends leaflet directly

    return leafletLib
  } catch (error) {
    console.error("Failed to load Leaflet for HubMap:", error)
    return null
  }
}

export default function HubMap({ hubs, selectedHubId, onSelect }: HubMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const markersRef = useRef<Record<string, { marker: Marker; point: HubPoint }>>({})
  const layerGroupRef = useRef<LayerGroup | null>(null)
  const prevSelectedIdRef = useRef<string | null>(null)
  const [leafletReady, setLeafletReady] = useState(false)
  const selectedId = selectedHubId != null ? String(selectedHubId) : null

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const lib = await ensureLeafletLoaded()
      if (!cancelled && lib) {
        setLeafletReady(true)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!leafletReady || mapRef.current || !containerRef.current) return

    const leaflet = leafletLib
    if (!leaflet) return

    const map = leaflet
      .map(containerRef.current, {
        worldCopyJump: true,
        zoomControl: true,
        scrollWheelZoom: true,
      })
      .setView([20, 0] as LatLngExpression, 2)

    leaflet
      .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      })
      .addTo(map)

    mapRef.current = map
  }, [leafletReady])

  const hubPoints = useMemo<HubPoint[]>(() => {
    if (!leafletReady) return []

    return hubs
      .map((hub) => {
        const coords = getHubCoordinates(hub)
        if (!coords) return null

        const labelParts = [hub.name, hub.city, hub.country].filter(Boolean)
        const label = labelParts.join(", ")
        const locationLabel = [hub.city, hub.country].filter(Boolean).join(", ")
        const priceLabel = formatHubPrice(hub)

        return {
          id: String(hub.id),
          hub,
          label,
          locationLabel,
          priceLabel,
          lat: coords.lat,
          lng: coords.lng,
        }
      })
      .filter((entry): entry is HubPoint => entry !== null)
  }, [hubs, leafletReady])

  useEffect(() => {
    if (!leafletReady) return

    const leaflet = leafletLib
    const map = mapRef.current
    if (!leaflet || !map) return

    Object.values(markersRef.current).forEach(({ marker }) => marker.remove())
    markersRef.current = {}

    if (layerGroupRef.current) {
      layerGroupRef.current.remove()
      layerGroupRef.current = null
    }

    if (!hubPoints.length) return

    // Create marker cluster group
    const group = (leaflet as any).markerClusterGroup({
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      spiderfyOnMaxZoom: true,
      removeOutsideVisibleBounds: true,
      maxClusterRadius: 50,
      iconCreateFunction: function (cluster: any) {
        const count = cluster.getChildCount()
        let size = "small"
        if (count > 10) size = "medium"
        if (count > 50) size = "large"

        return leaflet.divIcon({
          html: `<div class="hub-cluster-marker hub-cluster-marker--${size}"><span>${count}</span></div>`,
          className: "hub-cluster-wrapper",
          iconSize: [40, 40],
        })
      },
    })

    hubPoints.forEach((point) => {
      const marker = leaflet
        .marker([point.lat, point.lng], {
          icon: createMarkerIcon(point, { isActive: false }, leaflet),
          riseOnHover: true,
        })
        .addTo(group)

      marker.bindTooltip(createTooltipHtml(point), {
        direction: "top",
        offset: [0, -12],
        opacity: 1,
        permanent: false,
        sticky: true,
        interactive: true,
        className: "hub-marker-tooltip",
      })

      marker.on("click", () => {
        onSelect?.(point.hub.id)
      })

      marker.on("mouseover", () => {
        marker.openTooltip()
        onSelect?.(point.hub.id)
      })

      marker.on("mouseout", () => {
        marker.closeTooltip()
      })

      markersRef.current[point.id] = { marker, point }
    })

    group.addTo(map)
    layerGroupRef.current = group

    if (hubPoints.length === 1) {
      const point = hubPoints[0]
      map.setView([point.lat, point.lng], 9)
    } else {
      const bounds = leaflet.latLngBounds(
        hubPoints.map((point) => [point.lat, point.lng] as [number, number])
      )
      map.fitBounds(bounds.pad(0.2))
    }
  }, [hubPoints, leafletReady, onSelect])

  useEffect(() => {
    if (!leafletReady) return

    const leaflet = leafletLib
    if (!leaflet) return
    const lastSelectedId = prevSelectedIdRef.current

    Object.entries(markersRef.current).forEach(([id, { marker, point }]) => {
      const isActive = Boolean(selectedId && id === selectedId)
      const shouldAnimate = Boolean(
        isActive && selectedId && selectedId !== lastSelectedId
      )
      marker.setIcon(
        createMarkerIcon(point, { isActive, animate: shouldAnimate }, leaflet)
      )
      marker.setZIndexOffset(isActive ? 1000 : 0)
    })

    prevSelectedIdRef.current = selectedId ?? null
  }, [selectedId, leafletReady])

  return (
    <div className="relative h-full w-full rounded-xl border bg-white">
      <div ref={containerRef} className="h-full w-full rounded-xl" />
      {!leafletReady && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/80 text-sm text-gray-600">
          Loading map...
        </div>
      )}
      {leafletReady && hubPoints.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-white/85 p-6 text-center text-sm text-gray-500">
          We could not find map coordinates for these hubs yet. Update filters or try another search.
        </div>
      )}
    </div>
  )
}
