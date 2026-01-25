"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { MapPin, Calendar } from "lucide-react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { fetchLocationSuggestions, LocationSuggestion } from "@/lib/locationUtils"

interface EditTripFormProps {
  thread: any
}

export default function EditTripForm({ thread }: EditTripFormProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()

  const [title, setTitle] = useState(thread.title || "")
  const [body, setBody] = useState(thread.body || "")
  const [location, setLocation] = useState(thread.meta?.city_id || "")
  const [startDate, setStartDate] = useState(thread.meta?.start || "")
  const [endDate, setEndDate] = useState(thread.meta?.end || "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Location autocomplete state
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const suggestionRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Store standardized location data
  const [selectedStandardCity, setSelectedStandardCity] = useState<string | null>(null)
  const [selectedStandardCountry, setSelectedStandardCountry] = useState<string | null>(null)
  const [selectedLocationLat, setSelectedLocationLat] = useState<number | null>(null)
  const [selectedLocationLng, setSelectedLocationLng] = useState<number | null>(null)

  // Initialize location data from existing meta
  useEffect(() => {
    if (thread.meta?.city_id) {
      setSelectedStandardCity(thread.meta.city_id)
    }
    if (thread.meta?.location_lat) {
      setSelectedLocationLat(thread.meta.location_lat)
    }
    if (thread.meta?.location_lng) {
      setSelectedLocationLng(thread.meta.location_lng)
    }
  }, [thread])

  const handleLocationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocation(value)
    setSelectedStandardCity(null)
    setSelectedStandardCountry(null)
    setSelectedLocationLat(null)
    setSelectedLocationLng(null)

    if (value.length > 0) {
      setSuggestionsLoading(true)
      fetchLocationSuggestions(value)
        .then(suggestions => {
          setLocationSuggestions(suggestions)
          setShowSuggestions(true)
        })
        .catch(() => {
          setLocationSuggestions([])
        })
        .finally(() => {
          setSuggestionsLoading(false)
        })
    } else {
      setLocationSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    setLocation(suggestion.fullName)
    setSelectedStandardCity(suggestion.standardCity)
    setSelectedStandardCountry(suggestion.standardCountry)
    setSelectedLocationLat(suggestion.lat)
    setSelectedLocationLng(suggestion.lon)
    setShowSuggestions(false)
  }

  // Hide suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionRef.current &&
        !suggestionRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const trimmedTitle = title.trim()
    const trimmedBody = body.trim()
    const trimmedLocation = location.trim()

    if (!trimmedTitle || !trimmedBody) {
      toast.error("Title and description are required")
      return
    }

    if (!trimmedLocation) {
      toast.error("Destination is required for trips")
      return
    }

    if (!startDate || !endDate) {
      toast.error("Start and end dates are required for trips")
      return
    }

    try {
      setIsSubmitting(true)

      // Update the meta information
      const updatedMeta = {
        ...thread.meta,
        city_id: selectedStandardCity || trimmedLocation,
        start: startDate,
        end: endDate,
        location_lat: selectedLocationLat || thread.meta?.location_lat,
        location_lng: selectedLocationLng || thread.meta?.location_lng,
      }

      // Update the thread
      const { error } = await supabase
        .from("forum_topics")
        .update({
          title: trimmedTitle,
          body: trimmedBody,
          meta: updatedMeta
        })
        .eq("id", thread.id)

      if (error) throw error

      toast.success("Trip updated successfully")
      router.push(`/forum/thread/${thread.id}`)
      router.refresh()
    } catch (error: any) {
      console.error("Error updating trip:", error)
      toast.error(error.message || "Failed to update trip")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Trip title"
          required
        />
      </div>

      <div>
        <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <Textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Describe your trip"
          rows={4}
          required
        />
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
          Destination
        </label>
        <div className="relative">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <Input
              ref={inputRef}
              id="location"
              value={location}
              onChange={handleLocationInputChange}
              onFocus={() => {
                setInputFocused(true)
                if (locationSuggestions.length > 0) setShowSuggestions(true)
              }}
              onBlur={() => setInputFocused(false)}
              placeholder="Destination city (required for trips)"
              className="flex-1"
              required
            />
          </div>
          {showSuggestions && (
            <div ref={suggestionRef} className="absolute left-6 right-0 z-10 mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
              {suggestionsLoading && (
                <div className="px-3 py-2 text-sm text-gray-500">Searching…</div>
              )}
              {!suggestionsLoading && locationSuggestions.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-500">No matches</div>
              )}
              {!suggestionsLoading && locationSuggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                  onClick={() => handleSelectSuggestion(s)}
                >
                  {s.fullName}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/forum/thread/${thread.id}`)}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Updating..." : "Update Trip"}
        </Button>
      </div>
    </form>
  )
}

