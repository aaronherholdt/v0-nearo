import { NextResponse } from "next/server"

const norm = (s: string) =>
  (s || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()

const tokens = (s: string) =>
  norm(s)
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/[\s-]+/)
    .filter(Boolean)

const hav = (a: number) => Math.pow(Math.sin(a / 2), 2)
function distanceKm(lat1?: number, lon1?: number, lat2?: number, lon2?: number) {
  if (![lat1, lon1, lat2, lon2].every((n) => Number.isFinite(n))) return Number.POSITIVE_INFINITY
  const R = 6371, dLat = ((lat2!-lat1!) * Math.PI)/180, dLon = ((lon2!-lon1!) * Math.PI)/180
  const la1 = (lat1! * Math.PI)/180, la2 = (lat2! * Math.PI)/180
  const a = hav(dLat) + Math.cos(la1) * Math.cos(la2) * hav(dLon)
  return 2 * R * Math.asin(Math.sqrt(a))
}

type Row = {
  id: string
  fullName: string
  city: string
  country: string
  lat?: number
  lon?: number
  type?: string
}

// --- Source adapters ---
function fromPhoton(json: any): Row[] {
  const out: Row[] = []
  for (const f of json?.features ?? []) {
    const p = f.properties || {}
    const name: string = p.name || p.city || p.town || p.village || ""
    const country: string = p.country || ""
    const type: string = p.osm_value || ""
    if (!name || !country) continue
    out.push({
      id: String(p.osm_id ?? `${name}-${country}`),
      fullName: [name, p.state, country].filter(Boolean).join(", "),
      city: name,
      country,
      lat: f.geometry?.coordinates?.[1],
      lon: f.geometry?.coordinates?.[0],
      type,
    })
  }
  return out
}

function fromNominatim(rows: any[]): Row[] {
  return (rows || [])
    .map((r) => {
      const a = r.address || {}
      const name: string = a.city || a.town || a.village || a.locality || a.municipality || r.display_name?.split(",")?.[0] || ""
      const country: string = a.country || ""
      if (!name || !country) return null
      return {
        id: String(r.osm_id ?? r.place_id),
        fullName: country ? `${name}, ${country}` : r.display_name,
        city: name,
        country,
        lat: Number(r.lat),
        lon: Number(r.lon),
        type: r.type,
      }
    })
    .filter(Boolean) as Row[]
}

// --- Ranking: exact > startsWith > token-prefix > contains > proximity > place type ---
function ranker(q: string, bias?: { lat: number; lon: number }) {
  const qn = norm(q)
  const qTokens = tokens(q)
  const typeWeight: Record<string, number> = { city: 8, town: 6, village: 4, locality: 3, suburb: 2 }
  return (r: Row) => {
    const name = r.city
    const n = norm(name)
    const tks = tokens(name)
    let s = 0
    if (qn && n === qn) s += 100
    else if (qn && n.startsWith(qn)) s += 60
    else if (qTokens.length && qTokens.every((qt) => tks.some((tk) => tk.startsWith(qt)))) s += 40
    else if (qn && n.includes(qn)) s += 25
    // proximity is only a tie-breaker; never a hard bias
    if (bias) {
      const d = distanceKm(bias.lat, bias.lon, r.lat, r.lon)
      if (Number.isFinite(d)) s += Math.max(0, 18 - Math.min(18, d / 30)) // up to +18
    }
    s += typeWeight[r.type || ""] ?? 0
    return s
  }
}

function dedup(rows: Row[]) {
  const seen = new Set<string>()
  return rows.filter((r) => {
    const key = `${norm(r.city)}|${norm(r.country)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = url.searchParams.get("q") || ""
  const lat = url.searchParams.get("lat")
  const lon = url.searchParams.get("lon")
  const bias = lat && lon ? { lat: Number(lat), lon: Number(lon) } : undefined

  // --- Photon (global) ---
  const filter = [
    "place:city",
    "place:town",
    "place:village",
    "place:locality",
    "place:suburb",
  ]
    .map((t) => `&osm_tag=${t}`)
    .join("")

  const photonParams =
    `q=${encodeURIComponent(q || (bias ? `${bias.lat},${bias.lon}` : ""))}` +
    `&limit=15&lang=en${filter}` +
    (bias ? `&lat=${bias.lat}&lon=${bias.lon}` : "")

  try {
    const r = await fetch(`https://photon.komoot.io/api/?${photonParams}`, {
      headers: { "User-Agent": "nearo/1.0 (support@yourapp.com)" },
    })
    if (r.ok) {
      let rows = fromPhoton(await r.json())
      rows = dedup(rows).sort((a, b) => ranker(q, bias)(b) - ranker(q, bias)(a))
      const top = rows.slice(0, 8)
      if (top.length && ranker(q, bias)(top[0]) >= 90) {
        return NextResponse.json(top)
      }
    }
  } catch {
    // fall through to nominatim
  }

  // --- Nominatim (global fallback) ---
  const nomi = new URL("https://nominatim.openstreetmap.org/search")
  nomi.searchParams.set("format", "jsonv2")
  nomi.searchParams.set("addressdetails", "1")
  nomi.searchParams.set("limit", "15")
  nomi.searchParams.set("q", q || (bias ? `${bias.lat},${bias.lon}` : ""))

  const r2 = await fetch(nomi.toString(), {
    headers: {
      "User-Agent": "nearo/1.0 (support@yourapp.com)",
      "Accept-Language": "en",
    },
  })
  const rows2 = dedup(fromNominatim(await r2.json())).sort(
    (a, b) => ranker(q, bias)(b) - ranker(q, bias)(a)
  )

  return NextResponse.json(rows2.slice(0, 8))
}
