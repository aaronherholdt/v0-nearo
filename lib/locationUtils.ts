// lib/locationUtils.ts
export type LocationSuggestion = {
  id: string
  fullName: string
  city: string
  country: string
  standardCity: string
  standardCountry: string
  lat: number
  lon: number
}

// Add this small helper near the top of locationUtils.ts
const norm = (s: string) =>
  (s ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const inSouthAfrica = (lat: number, lon: number) =>
  lat >= -35 && lat <= -22 && lon >= 16 && lon <= 33; // rough ZA bbox

export const normalizeCity = (input?: string | null) =>
  (input ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(",")[0]
    .trim()

// ---- REPLACE your fetchLocationSuggestions WITH THIS ----
export const fetchLocationSuggestions = async (
  query: string,
  userLocation?: { latitude: number; longitude: number }
): Promise<LocationSuggestion[]> => {
  const q = query?.trim() ?? "";
  const qn = norm(q.split(",")[0]); // compare only the head term
  const bias = userLocation ? { lat: userLocation.latitude, lon: userLocation.longitude } : null;

  // Ranker: exact > startsWith > contains > proximity > place type
  const score = (name: string, lat?: number, lon?: number, type?: string) => {
    const n = norm(name);
    let s = 0;
    if (qn && n === qn) s += 100;
    if (qn && n.startsWith(qn)) s += 40;
    if (qn && n.includes(qn)) s += 20;
    if (bias && Number.isFinite(lat) && Number.isFinite(lon)) {
      const dLat = ((lat! - bias.lat) * Math.PI) / 180;
      const dLon = ((lon! - bias.lon) * Math.PI) / 180;
      const la1 = (bias.lat * Math.PI) / 180;
      const la2 = (lat! * Math.PI) / 180;
      const hav = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
      const dKm = 2 * 6371 * Math.asin(Math.sqrt(hav));
      s += Math.max(0, 20 - Math.min(20, dKm / 25)); // up to +20 for being nearby
    }
    if (type && (type === "city" || type === "town")) s += 10;
    return s;
  };

  const dedup = (rows: any[]) => {
    const seen = new Set<string>();
    return rows.filter((r) => {
      const key = `${norm(r.city)}|${norm(r.country)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  // 1) PHOTON first (better partials like "Mossel" -> "Mossel Bay")
  try {
    const params = new URLSearchParams();
    params.set("q", q || (bias ? `${bias.lat},${bias.lon}` : ""));
    params.set("limit", "25");
    params.set("lang", "en");
    // Only population places:
    ["place:country", "place:region", "place:state", "place:city", "place:town", "place:village", "place:municipality", "place:suburb", "place:island", "boundary:administrative"].forEach((t) => params.append("osm_tag", t));
    if (bias) {
      params.set("lat", String(bias.lat));
      params.set("lon", String(bias.lon));
    }

    const res = await fetch(`https://photon.komoot.io/api/?${params.toString()}`);
    if (res.ok) {
      const json = await res.json();
      const rows = (json?.features ?? [])
        .map((f: any) => {
          const p = f.properties || {};
          const name: string = p.name || p.city || "";
          const country: string = p.country || "";
          const type: string = p.osm_value || "";
          const lat = f.geometry?.coordinates?.[1];
          const lon = f.geometry?.coordinates?.[0];
          if (!name || !country) return null;
          return {
            id: String(p.osm_id ?? `${name}-${country}`),
            name,
            fullName: [name, p.state, country].filter(Boolean).join(", "),
            city: name,
            country,
            standardCity: norm(name),
            standardCountry: norm(country),
            latitude: lat,
            longitude: lon,
            type,
            _score: score(name, lat, lon, type),
          };
        })
        .filter(Boolean);

      let out = dedup(rows).sort((a: any, b: any) => b._score - a._score).slice(0, 8);
      // If we got a very strong match (Knysna, Mossel Bay, Plettenberg Bay), return now
      if (out.length && out[0]._score >= 90) {
        return out.map(({ _score, type, ...r }: any) => r);
      }

      // Keep as candidate if decent
      if (out.length) {
        return out.map(({ _score, type, ...r }: any) => r);
      }
    }
  } catch {
    // ignore and fall back to Nominatim
  }

  // 2) NOMINATIM fallback with ZA country bias if user is in South Africa
  try {
    const params = new URLSearchParams({
      format: "jsonv2",
      addressdetails: "1",
      limit: "12",
      q: q || (bias ? `${bias.lat},${bias.lon}` : ""),
    });
    if (bias && inSouthAfrica(bias.lat, bias.lon)) {
      params.set("countrycodes", "za");
    }
    // Lightly bias around user without constraining
    if (bias) {
      const latDelta = 0.45;
      const lonDelta = 0.45 / Math.cos((bias.lat * Math.PI) / 180);
      params.set(
        "viewbox",
        [
          bias.lon - lonDelta,
          bias.lat - latDelta,
          bias.lon + lonDelta,
          bias.lat + latDelta,
        ].join(",")
      );
      params.set("bounded", "0");
    }

    const r = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: { "Accept-Language": "en" },
    });
    if (!r.ok) return [];

    const data = await r.json();

    const rows = (Array.isArray(data) ? data : [])
      .map((item: any) => {
        const a = item.address || {};
        const name: string =
          a.city || a.town || a.village || a.municipality || item.display_name?.split(",")?.[0] || "";
        const country: string = a.country || "";
        const type: string = item.type || "";
        if (!name || !country) return null;
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        return {
          id: String(item.osm_id ?? item.place_id),
          name,
          fullName: country ? `${name}, ${country}` : item.display_name,
          city: name,
          country,
          standardCity: norm(name),
          standardCountry: norm(country),
          latitude: lat,
          longitude: lon,
          type,
          _score: score(name, lat, lon, type),
        };
      })
      // keep only meaningful population places
      .filter(
        (x: any) =>
          x &&
          (x.type === "city" || x.type === "town" || x.type === "village" || x.type === "municipality")
      );

    const out = dedup(rows)
      .sort((a: any, b: any) => b._score - a._score)
      .slice(0, 12)
      .map(({ _score, type, ...r }: any) => r);

    return out;
  } catch (e) {
    console.error("Error fetching location suggestions:", e);
    return [];
  }
};

export function getCurrentPosition(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Geolocation not available"))
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      reject,
      { enableHighAccuracy: true, timeout: 7000 }
    )
  })
}

export async function reverseGeocode(lat: number, lon: number): Promise<LocationSuggestion | null> {
  try {
    const params = new URLSearchParams()
    params.set("lat", String(lat))
    params.set("lon", String(lon))

    const res = await fetch(`/api/geocode?${params.toString()}`)
    const rows = (await res.json()) as any[]

    if (rows.length === 0) return null

    // Return the first (closest) result
    const row = rows[0]
    return {
      id: row.id,
      fullName: row.fullName,
      city: row.city,
      country: row.country,
      standardCity: normalizeCity(row.city)!,
      standardCountry: normalizeCity(row.country)!,
      lat: Number(row.lat),
      lon: Number(row.lon),
    }
  } catch (error) {
    console.error("Reverse geocoding error:", error)
    return null
  }
}