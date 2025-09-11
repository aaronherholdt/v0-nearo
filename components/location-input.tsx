"use client"

import * as React from "react"
import { fetchLocationSuggestions } from "@/lib/locationUtils"

export type PickedLocation = {
  id?: string
  fullName: string
  city: string
  country?: string
  latitude?: number | null
  longitude?: number | null
}

function useDebounce<T>(value: T, ms = 250) {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return debounced
}

export default function LocationInput(props: {
  value: string
  onValueChange: (v: string) => void
  onPick: (loc: PickedLocation) => void
  placeholder?: string
  autoFocus?: boolean
  userPosition?: { latitude: number; longitude: number } | null
}) {
  const { value, onValueChange, onPick, userPosition, placeholder, autoFocus } = props
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [rows, setRows] = React.useState<any[]>([])
  const debounced = useDebounce(value, 250)

  React.useEffect(() => {
    let alive = true
    const q = debounced.trim()
    if (!q) { setRows([]); return }
    setLoading(true)
    fetchLocationSuggestions(q, userPosition || undefined)
      .then((r) => { if (alive) setRows(r) })
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [debounced, userPosition])

  return (
    <div className="relative">
      <input
        className="w-full rounded-md border px-3 py-2"
        value={value}
        onChange={(e) => { onValueChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder || "City, Town or Village"}
        autoFocus={autoFocus}
      />
      {open && (rows.length > 0 || loading) && (
        <div className="absolute z-20 mt-1 w-full rounded-md border bg-white shadow">
          {loading ? (
            <div className="px-3 py-2 text-sm text-gray-500">Searching…</div>
          ) : rows.map((r) => (
            <button
              key={r.id + r.fullName}
              type="button"
              className="block w-full px-3 py-2 text-left hover:bg-gray-50"
              onClick={() => {
                onPick({
                    id: r.id,
                    fullName: r.fullName,
                    city: r.city,
                    country: r.country,
                    latitude: r.lat ?? r.latitude ?? null,
                    longitude: r.lon ?? r.longitude ?? null,
                })
                onValueChange(r.fullName)
                setOpen(false)
              }}
            >
              {r.fullName}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
