"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import LocationInput, { PickedLocation } from "@/components/location-input"

// Dynamic import for Leaflet to avoid SSR issues
let L: any = null
let Map: any = null
let Layer: any = null

// NOTE: we'll use circle markers (no icon images) to avoid Next asset quirks.

type ProfileRow = {
  id: string
  family_name: string | null
  location_lat: number | null | undefined
  location_lng: number | null | undefined
  location_full_name: string | null
  family_photo_url: string | null
  available_to_meet: boolean | null
  last_seen_at: string | null
}

export default function WorldMap() {
  const supabase = createClientComponentClient()
  const mapEl = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  const [locationText, setLocationText] = useState("")
  const [pickedLocation, setPickedLocation] = useState<PickedLocation | null>(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)

  // keep a reference to marker layers so we can show/hide them
  const markersRef = useRef<{ [id: string]: { layer: any; profile: ProfileRow; isSearchMatch?: boolean; baseStyle?: any } }>({})
  const badgeMarkersRef = useRef<{ [id: string]: any }>({})

  // 1) Load Leaflet dynamically to avoid SSR issues
  useEffect(() => {
    const loadLeaflet = async () => {
      try {
        const leafletModule = await import('leaflet')
        L = leafletModule.default
        Map = leafletModule.Map
        Layer = leafletModule.Layer

        // Load CSS
        await import('leaflet/dist/leaflet.css')
        setLeafletLoaded(true)
      } catch (error) {
        console.error('Failed to load Leaflet:', error)
      }
    }

    loadLeaflet()
  }, [])

  // 2) init map once Leaflet is loaded
  useEffect(() => {
    if (!leafletLoaded || !L || !mapEl.current || mapRef.current) return

    const map = L.map(mapEl.current, {
      worldCopyJump: true,
      zoomControl: true,
    }).setView([20, 0], 2)

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map)

    mapRef.current = map
  }, [leafletLoaded])

  // 3) load profiles with coordinates
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, family_name, location_lat, location_lng, location_full_name, family_photo_url, available_to_meet, last_seen_at"
        )
        .not("location_lat", "is", null)
        .not("location_lng", "is", null)

      if (error) {
        console.error("Load profiles failed:", error)
        return
      }
      if (!cancelled) setProfiles((data as ProfileRow[]) || [])
    })()
    return () => {
      cancelled = true
    }
  }, [supabase])

  // realtime subscription: add/remove/update markers live
  useEffect(() => {
    if (!leafletLoaded) return;

    const channel = supabase
      .channel("profiles-realtime")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload: any) => {
          const event = payload.eventType as "INSERT" | "UPDATE" | "DELETE";
          const row = (payload.new ?? payload.old) as any;

          // Keep our local list in sync for search suggestions etc.
          setProfiles((prev) => {
            const copy = [...prev];
            const idx = copy.findIndex((x) => x.id === row.id);

            if (event === "DELETE") {
              if (idx !== -1) copy.splice(idx, 1);
              removeMarker(row.id);
              return copy;
            }

            const p: ProfileRow = {
              id: row.id,
              family_name: row.family_name ?? null,
              location_lat: row.location_lat ?? null,
              location_lng: row.location_lng ?? null,
              location_full_name: row.location_full_name ?? null,
              family_photo_url: row.family_photo_url ?? null,
              available_to_meet: row.available_to_meet ?? null,
              last_seen_at: row.last_seen_at ?? null,
            };

            // For UPDATE events, only remove markers if coordinates are explicitly set to null
            // For INSERT events, check if coordinates exist
            // Never remove markers just because fields are missing from the payload
            const hasValidCoords = p.location_lat != null && p.location_lng != null;
            const coordsExplicitlyNull = event === "UPDATE" &&
              "location_lat" in row && "location_lng" in row &&
              row.location_lat === null && row.location_lng === null;

            if (hasValidCoords) {
              upsertMarker(p);
            } else if (coordsExplicitlyNull) {
              removeMarker(p.id);
            }

            if (idx === -1) copy.push(p);
            else copy[idx] = p;

            return copy;
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, leafletLoaded]);

  // 4) draw markers whenever profiles change
  useEffect(() => {
    const map = mapRef.current;
    if (!leafletLoaded || !map || !L) return;

    const bounds = L.latLngBounds([]);
    const currentMarkerIds = new Set(Object.keys(markersRef.current));
    const profileIds = new Set<string>();

    // Add or update markers for all profiles
    profiles.forEach((p) => {
      if (p.location_lat != null && p.location_lng != null) {
        profileIds.add(p.id);
        upsertMarker(p);
        bounds.extend([p.location_lat, p.location_lng]);
      }
    });

    // Only remove markers that are no longer in profiles
    currentMarkerIds.forEach((id) => {
      if (!profileIds.has(id)) {
        removeMarker(id);
      }
    });

    // Only fit bounds on initial load or if we have very few markers
    // (Don't re-fit on every profile update)
    if (bounds.isValid() && Object.keys(markersRef.current).length <= 3) {
      map.fitBounds(bounds.pad(0.2));
    }
  }, [profiles, leafletLoaded]);

  // 5) auto-reset when field is cleared
  useEffect(() => {
    const map = mapRef.current
    if (!leafletLoaded || !map) return
    if (!locationText && !pickedLocation) {
      showAll()
    }
  }, [locationText, pickedLocation, leafletLoaded])

  // auto-restyle every 30s (so pins fade from "online")
  useEffect(() => {
    const t = setInterval(() => {
      Object.values(markersRef.current).forEach(({ layer, profile, isSearchMatch = true }) => {
        restyleMarker(layer, profile, isSearchMatch);
      });
    }, 30_000);
    return () => clearInterval(t);
  }, []);

  // listen for zoom changes to update badge visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!leafletLoaded || !map) return;

    map.on('zoomend', updateBadgeVisibility);
    updateBadgeVisibility(); // Initial check

    return () => {
      map.off('zoomend', updateBadgeVisibility);
    };
  }, [leafletLoaded]);

  // 6) compute a simple list of city strings for suggestions (from your data)
  const cityOptions = useMemo(() => {
    const set = new Set<string>()
    profiles.forEach((p) => {
      const label =
        (p.location_full_name || "").split(",")[0].trim() ||
        (p.location_full_name || "")
      if (label) set.add(label)
    })
    return Array.from(set).sort()
  }, [profiles])

  function kmBetween(aLat: number, aLng: number, bLat: number, bLng: number) {
    const toRad = (d: number) => (d * Math.PI) / 180
    const R = 6371
    const dLat = toRad(bLat - aLat)
    const dLng = toRad(bLng - aLng)
    const s1 =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(s1), Math.sqrt(1 - s1))
  }


  function isOnline(p: Pick<ProfileRow, "last_seen_at">) {
    if (!p.last_seen_at) return false;
    return (Date.now() - new Date(p.last_seen_at).getTime()) < 5 * 60 * 1000;
  }

  function getBaseStyle(p: ProfileRow) {
    const online = isOnline(p);

    // Border (stroke) color logic:
    // - online: slightly darker emerald ring
    // - else if available_to_meet: emerald ring (more prominent)
    // - else: slate ring
    const stroke = online ? "#059669" : (p.available_to_meet ? "#10b981" : "#64748b");

    return {
      radius: 7,
      weight: p.available_to_meet && !online ? 3 : 2, // thicker border for available users
      color: stroke,
      // **Online users = filled green**
      fillColor: online ? "#10b981" : "#ffffff",
    };
  }

  function restyleMarker(marker: any, p: ProfileRow, isSearchMatch: boolean = true) {
    const baseStyle = getBaseStyle(p);

    // Reduce opacity for non-matching search results
    const opacity = isSearchMatch ? 0.9 : 0.3;
    const fillOpacity = isSearchMatch ? 0.9 : 0.2;

    marker.setStyle({
      ...baseStyle,
      opacity: opacity,
      fillOpacity: fillOpacity,
    });
  }

  function ensurePopupHtml(p: ProfileRow) {
    return `<div style="min-width:180px">
      <div style="font-weight:600">${p.family_name || "Family"}</div>
      <div style="font-size:12px;color:#6b7280">${p.location_full_name || ""}</div>
      <div style="margin-top:8px">
        <button onclick="window.location.href='/families/${p.id}'" style="background:#10b981;color:white;border:none;padding:4px 8px;border-radius:4px;font-size:12px;cursor:pointer;">
          View Profile
        </button>
      </div>
    </div>`;
  }

  function getLocationCount(lat: number, lng: number): number {
    return profiles.filter(
      (prof) => prof.location_lat === lat && prof.location_lng === lng
    ).length;
  }

  function updateBadgeVisibility() {
    const map = mapRef.current;
    if (!map) return;

    const zoom = map.getZoom();
    const showBadges = zoom < 10; // Hide badges when zoomed in past level 10

    Object.values(badgeMarkersRef.current).forEach((badge) => {
      if (showBadges) {
        badge.setOpacity(1);
      } else {
        badge.setOpacity(0);
      }
    });
  }

  function getOffsetCoordinates(lat: number, lng: number, profileId: string, allProfiles: ProfileRow[]): [number, number] {
    // Find all profiles at this exact location
    const sameLocation = allProfiles.filter(
      (prof) => prof.location_lat === lat && prof.location_lng === lng
    );

    // If only one profile at this location, no offset needed
    if (sameLocation.length <= 1) return [lat, lng];

    // Sort by ID to ensure consistent ordering
    const sorted = [...sameLocation].sort((a, b) => a.id.localeCompare(b.id));
    const index = sorted.findIndex((p) => p.id === profileId);

    if (index === -1) return [lat, lng];

    // Arrange markers in a circle around the original point
    // Offset by ~0.008 degrees (roughly 800 meters)
    const offsetDistance = 0.008;
    const angle = (index * 2 * Math.PI) / sameLocation.length;

    const latOffset = offsetDistance * Math.cos(angle);
    const lngOffset = offsetDistance * Math.sin(angle);

    return [lat + latOffset, lng + lngOffset];
  }

  function upsertMarker(p: ProfileRow) {
    const map = mapRef.current;
    if (!map || !L || p.location_lat == null || p.location_lng == null) return;

    // Get offset coordinates to prevent stacking
    const [displayLat, displayLng] = getOffsetCoordinates(p.location_lat, p.location_lng, p.id, profiles);

    const existing = markersRef.current[p.id];
    if (existing) {
      existing.layer.setLatLng([displayLat, displayLng]);
      restyleMarker(existing.layer, p, existing.isSearchMatch ?? true);
      existing.layer.setPopupContent(ensurePopupHtml(p));
      existing.profile = p;
      // Ensure baseStyle is stored for existing markers
      if (!existing.baseStyle) {
        existing.baseStyle = existing.layer.options;
      }
      return;
    }

    // create
    const locationCount = getLocationCount(p.location_lat, p.location_lng);
    const baseStyle = getBaseStyle(p);
    const marker = L.circleMarker([displayLat, displayLng], baseStyle).addTo(map);
    restyleMarker(marker, p, true);

    // Add count badge for multiple families at same location
    const badgeKey = `${p.location_lat},${p.location_lng}`;
    if (locationCount > 1 && !badgeMarkersRef.current[badgeKey]) {
      const icon = L.divIcon({
        html: `<div style="background:#10b981;color:white;border-radius:12px;padding:3px 7px;font-size:11px;font-weight:600;box-shadow:0 2px 4px rgba(0,0,0,0.3);min-width:20px;text-align:center;">${locationCount}</div>`,
        className: 'count-badge',
        iconSize: [24, 24],
        iconAnchor: [12, 12]  // Center the badge exactly on the coordinate
      });
      const badge = L.marker([p.location_lat, p.location_lng], { icon }).addTo(map);
      badgeMarkersRef.current[badgeKey] = badge;
      updateBadgeVisibility();
    }

    let closeTimeout: NodeJS.Timeout | null = null;

    marker.bindPopup(ensurePopupHtml(p), {
      closeButton: false,
      closeOnClick: false
    });

    const openPopupHandler = () => {
      if (closeTimeout) {
        clearTimeout(closeTimeout);
        closeTimeout = null;
      }
      marker.openPopup();
    };

    marker.on("mouseover", openPopupHandler);
    marker.on("click", openPopupHandler);  // Click also just opens the popup

    marker.on("mouseout", () => {
      closeTimeout = setTimeout(() => marker.closePopup(), 100);
    });

    marker.on("popupopen", () => {
      const popupEl = marker.getPopup().getElement();
      if (popupEl) {
        popupEl.addEventListener("mouseenter", () => {
          if (closeTimeout) {
            clearTimeout(closeTimeout);
            closeTimeout = null;
          }
        });
        popupEl.addEventListener("mouseleave", () => {
          closeTimeout = setTimeout(() => marker.closePopup(), 100);
        });
      }
    });
    markersRef.current[p.id] = {
      layer: marker,
      profile: p,
      isSearchMatch: true,
      baseStyle: marker.options, // remember original look
    };
  }

  function removeMarker(id: string) {
    const map = mapRef.current;
    const hit = markersRef.current[id];
    if (!map || !hit) return;

    // Remove badge if this was the last marker at this location
    const badgeKey = `${hit.profile.location_lat},${hit.profile.location_lng}`;
    const remainingAtLocation = profiles.filter(
      p => p.id !== id && p.location_lat === hit.profile.location_lat && p.location_lng === hit.profile.location_lng
    ).length;

    if (remainingAtLocation <= 1 && badgeMarkersRef.current[badgeKey]) {
      map.removeLayer(badgeMarkersRef.current[badgeKey]);
      delete badgeMarkersRef.current[badgeKey];
    }

    map.removeLayer(hit.layer);
    delete markersRef.current[id];
  }

  function runSearch() {
    const map = mapRef.current
    if (!leafletLoaded || !map || !L) return

    // 1) picked a suggestion -> use lat/lng
    if (pickedLocation && typeof pickedLocation.latitude === 'number' && typeof pickedLocation.longitude === 'number') {
      const searchLat = pickedLocation.latitude as number
      const searchLng = pickedLocation.longitude as number
      const RADIUS_KM = 150
      map.setView([searchLat, searchLng], 11) // immediate feedback

      // after you've geocoded and panned/fitBounds to the city:
      const matches = countFamiliesWithinRadius([searchLat, searchLng], RADIUS_KM)
      if (matches > 0) {
        highlightNearby([searchLat, searchLng], RADIUS_KM)
      } else {
        // no one nearby -> don't show an empty map
        restoreAll()
        // (optional) toast: "No families within 150 km. Showing everyone."
      }
      return
    }

    // 2) text-only fallback (no suggestion picked)
    const needle = locationText.trim().toLowerCase()
    if (!needle) return showAll()

    const bounds = L.latLngBounds([])
    let matches = 0
    Object.entries(markersRef.current).forEach(([id, { layer, profile }]) => {
      const hay = (profile.location_full_name || "").toLowerCase()
      const isMatch = hay.includes(needle)
      if (isMatch) {
        bounds.extend([profile.location_lat!, profile.location_lng!])
        matches++
      }
      // Update search match status and restyle
      markersRef.current[id].isSearchMatch = isMatch
      restyleMarker(layer, profile, isMatch)
    })
    if (matches && bounds.isValid()) map.fitBounds(bounds.pad(0.2))
  }

  function showAll() {
    const map = mapRef.current
    if (!leafletLoaded || !map || !L) return
    // Reset all markers to be search matches (full opacity)
    Object.entries(markersRef.current).forEach(([id, { layer, profile }]) => {
      markersRef.current[id].isSearchMatch = true
      restyleMarker(layer, profile, true)
    })
    const bounds = L.latLngBounds([])
    Object.values(markersRef.current).forEach(({ profile }) => {
      if (profile.location_lat && profile.location_lng) bounds.extend([profile.location_lat, profile.location_lng])
    })
    if (bounds.isValid()) map.fitBounds(bounds.pad(0.2))
    setPickedLocation(null)
    setLocationText("")
  }

  const DIM = { opacity: 0.25, fillOpacity: 0.15, weight: 1 }
  const EMPHASIZE = { opacity: 1, fillOpacity: 1, weight: 3 }

  function restoreAll() {
    Object.values(markersRef.current).forEach(({ layer, baseStyle }) => {
      (layer as any).setStyle({ ...baseStyle, ...EMPHASIZE })
      ;(layer as any).bringToFront()
    })
  }

  function countFamiliesWithinRadius(center: [number, number], radiusKm: number): number {
    let count = 0
    Object.values(markersRef.current).forEach(({ profile }) => {
      if (typeof profile.location_lat === 'number' && typeof profile.location_lng === 'number') {
        const dKm = kmBetween(center[0], center[1], profile.location_lat, profile.location_lng)
        if (dKm <= radiusKm) count++
      }
    })
    return count
  }

  function highlightNearby(center: [number, number], radiusKm = 150) {
    Object.values(markersRef.current).forEach(({ layer, profile, baseStyle }) => {
      const dKm = kmBetween(
        center[0], center[1],
        profile.location_lat!, profile.location_lng!
      )
      if (dKm <= radiusKm) {
        (layer as any).setStyle({ ...baseStyle, ...EMPHASIZE })
        ;(layer as any).bringToFront()
      } else {
        (layer as any).setStyle({ ...baseStyle, ...DIM })
      }
    })
  }

  if (!leafletLoaded) {
    return (
      <div className="space-y-3">
        {/* Search bar */}
        <div
          className="flex items-center gap-2"
          onKeyDown={(e) => { if (e.key === "Enter") runSearch() }}
        >
          <div className="w-full md:w-96">
            <LocationInput
              value={locationText}
              onValueChange={setLocationText}
              onPick={(p) => setPickedLocation(p)}
              placeholder="Type a city (e.g., Istanbul, Turkey)"
            />
          </div>
          <button
            onClick={runSearch}
            disabled={!locationText && !pickedLocation}
            className="rounded-md bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-2 text-sm text-white hover:bg-emerald-700 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer"
          >
            Search
          </button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 p-3 bg-white border rounded-lg shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-emerald-700 bg-emerald-600"></div>
            <span className="text-sm text-gray-700">Online (active now)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-emerald-600 bg-white" style={{ borderWidth: '3px' }}></div>
            <span className="text-sm text-gray-700">Available to meet</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-slate-400 bg-white"></div>
            <span className="text-sm text-gray-700">Not available</span>
          </div>
        </div>

        {/* Loading placeholder */}
        <div
          style={{ height: "72vh", width: "100%", borderRadius: 12 }}
          className="border bg-gray-100 flex items-center justify-center"
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading world map...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div
        className="flex items-center gap-2"
        onKeyDown={(e) => { if (e.key === "Enter") runSearch() }}
      >
        <div className="w-full md:w-96">
          <LocationInput
            value={locationText}
            onValueChange={setLocationText}
            onPick={(p) => setPickedLocation(p)}
            placeholder="Type a city (e.g., Istanbul, Turkey)"
          />
        </div>
        <button
          onClick={runSearch}
          disabled={!locationText && !pickedLocation}
          className="rounded-md bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-2 text-sm text-white hover:bg-emerald-700 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer"
        >
          Search
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 p-3 bg-white border rounded-lg shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-emerald-700 bg-emerald-600"></div>
          <span className="text-sm text-gray-700">Online (active now)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-emerald-600 bg-white" style={{ borderWidth: '3px' }}></div>
          <span className="text-sm text-gray-700">Available to meet</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-slate-400 bg-white"></div>
          <span className="text-sm text-gray-700">Not available</span>
        </div>
      </div>

      {/* Map */}
      <div
        ref={mapEl}
        style={{ height: "72vh", width: "100%", borderRadius: 12, overflow: "hidden" }}
        className="border"
      />
    </div>
  )
}

