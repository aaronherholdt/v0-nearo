"use client"

// add once in this file (top): same normalizer used above
const normalizeCity = (s: string | null | undefined) =>
  s ? String(s).split(",")[0]
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim() : null;

import { useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, MapPin } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { fetchLocationSuggestions, getCurrentPosition, type LocationSuggestion } from "@/lib/locationUtils"

type MetaInput = {
  section: "General" | "Trips" | "Meetups" | "Hubs"
  tripId?: string
  hubId?: string
  meetupId?: string
  form: {
    cityId?: string
    start?: string
    end?: string
    kidsAges?: number[]
    interests?: string[]
    placeId?: string
    time?: string
    ageMin?: number
    ageMax?: number
    locationLat?: number
    locationLng?: number
  }
}

function buildMeta(m: MetaInput) {
  switch (m.section) {
    case "Trips":
      return {
        city_id: m.form.cityId ?? null,
        start: m.form.start ?? null,
        end: m.form.end ?? null,
        kids_ages: m.form.kidsAges ?? [],
        interests: m.form.interests ?? [],
        trip_id: m.tripId ?? null,
        location_lat: m.form.locationLat ?? null,
        location_lng: m.form.locationLng ?? null,
      }
    case "Meetups":
      return {
        place_id: m.form.placeId ?? null,
        time: m.form.time ?? null,
        age_min: m.form.ageMin ?? null,
        age_max: m.form.ageMax ?? null,
        city_id: m.form.cityId ?? null,
        meetup_id: m.meetupId ?? null,
        location_lat: m.form.locationLat ?? null,
        location_lng: m.form.locationLng ?? null,
      }
    case "Hubs":
      return { hub_id: m.hubId ?? null }
    
    default:
      return {}
  }
}

type ComposerProps = {
  onPost?: (data: { title: string; body: string; category: string }) => void
  tripId?: string
  hubId?: string
  meetupId?: string
}

export default function ContextComposer({ onPost, tripId, hubId, meetupId }: ComposerProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const section = useMemo(() => {
    if (pathname?.startsWith("/forum/trips")) return "Trips"
    if (pathname?.startsWith("/forum/meetups")) return "Meetups"
    if (pathname?.startsWith("/forum/hubs")) return "Hubs"
    return "General"
  }, [pathname])

  const placeholders = {
    General: {
      title: "Title: e.g., Playdate in {city} this weekend?",
      body: "Write a short description...",
      chips: ["Question", "Advice", "Share"]
    },
    Trips: {
      title: "Trip: where and when?",
      body: "Outline destination, dates, and interests",
      chips: ["Date overlap", "Looking for buddies", "Itinerary"]
    },
    Meetups: {
      title: "Meetup: what, where, when?",
      body: "Add location and time so others can RSVP",
      chips: ["Park day", "Library", "Museum"]
    },
    Hubs: {
      title: "City hub: tips or questions",
      body: "Ask about neighborhoods, transport, or activities",
      chips: ["Accommodation", "Food", "Transport"]
    },
  } as const

  const p = placeholders[section as keyof typeof placeholders]
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [location, setLocation] = useState("")
  const [tripStart, setTripStart] = useState("")
  const [tripEnd, setTripEnd] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Autocomplete state for location/destination
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null)
  const suggestionRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [selectedStandardCity, setSelectedStandardCity] = useState<string | null>(null)
  const [selectedStandardCountry, setSelectedStandardCountry] = useState<string | null>(null)
  const [selectedLocationLat, setSelectedLocationLat] = useState<number | null>(null)
  const [selectedLocationLng, setSelectedLocationLng] = useState<number | null>(null)

  // Grab user's location on mount to bias suggestions
  useEffect(() => {
    ;(async () => {
      try {
        const coords = await getCurrentPosition()
        setUserLocation(coords)
        // Preload nearby suggestions
        fetchNearbySuggestions(coords)
      } catch {
        // Ignore geolocation errors silently
      }
    })()

    return () => {
      if (debounceTimeout) clearTimeout(debounceTimeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchNearbySuggestions = async (position: { latitude: number; longitude: number }) => {
    try {
      setSuggestionsLoading(true)
      const suggestions = await fetchLocationSuggestions("", position)
      setLocationSuggestions(suggestions)
    } catch {
      // noop
    } finally {
      setSuggestionsLoading(false)
    }
  }

  const handleLocationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocation(value)
    setSelectedStandardCity(null)
    setSelectedStandardCountry(null)

    if (debounceTimeout) clearTimeout(debounceTimeout)

    const timeout = setTimeout(async () => {
      if (value.length > 0) {
        setSuggestionsLoading(true)
        try {
          const suggestions = await fetchLocationSuggestions(value, userLocation || undefined)
          setLocationSuggestions(suggestions)
          setShowSuggestions(true)
        } catch {
        } finally {
          setSuggestionsLoading(false)
        }
      } else {
        if (userLocation) {
          fetchNearbySuggestions(userLocation)
          setShowSuggestions(inputFocused)
        } else {
          setLocationSuggestions([])
          setShowSuggestions(false)
        }
      }
    }, 300)

    setDebounceTimeout(timeout)
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

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmedTitle = title.trim()
    const trimmedBody = body.trim()
    const trimmedLocation = location.trim()
    
    if (!trimmedTitle || !trimmedBody) return
    
    // Location is required for meetups and trips
    if (section === "Meetups" && !trimmedLocation) {
      setError("Please add a location for your meetup")
      return
    }
    if (section === "Trips" && !trimmedLocation) {
      setError("Please add a destination city for your trip")
      return
    }

    try {
      setSubmitting(true)

      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) {
        router.push("/auth/login")
        return
      }

      // Normalize UI section to DB category slug
      const category = section.toLowerCase()

      // Fetch lightweight profile details used for meta
      const { data: profile } = await supabase
        .from("profiles")
        .select("family_name, children")
        .eq("id", auth.user.id)
        .single()

      // Derive kids ages from children JSON if available
      const kidsAgesArray: number[] = Array.isArray(profile?.children)
        ? (profile?.children as any[])
            .map((c: any) => (typeof c?.age === "number" ? c.age : Number.parseInt(String(c?.age ?? ""), 10)))
            .filter((n: number) => Number.isFinite(n))
        : []

      // Get user's location information
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("standard_city, standard_country")
        .eq("id", auth.user.id)
        .single()
      
      // ...when building meta.form.cityId:
      const standardizedTripCity = normalizeCity(trimmedLocation);

      const meta = buildMeta({
        section: section as MetaInput["section"],
        tripId,
        hubId,
        meetupId,
        form: {
          kidsAges: kidsAgesArray,
          placeId: section === "Meetups" ? trimmedLocation : undefined,
          cityId: (selectedStandardCity || standardizedTripCity) ?? undefined,
          // Trip date range
          start: section === "Trips" ? (tripStart || undefined) : undefined,
          end: section === "Trips" ? (tripEnd || undefined) : undefined,
          // Extract time from title if it's a meetup
          time: section === "Meetups" ? extractTimeFromTitle(trimmedTitle) : undefined,
          // Location coordinates
          locationLat: selectedLocationLat || undefined,
          locationLng: selectedLocationLng || undefined,
        },
      })

      const { data: topic, error: insertErr } = await supabase
        .from("forum_topics")
        .insert({
          author_id: auth.user.id,
          title: trimmedTitle,
          body: trimmedBody,
          category,
          meta,
          author_family_name: profile?.family_name || null,
        })
        .select("id")
        .single()

      if (insertErr) throw insertErr

      // Optional entity cross-links
      const linkRows: Array<{ topic_id: string | number; entity_kind: string; entity_id: string | number; reason: string; score: number }> = []
      if (tripId) {
        linkRows.push({
          topic_id: topic.id,
          entity_kind: "travel_plan",
          entity_id: tripId,
          reason: "authored_for_trip",
          score: 80,
        })
      }
      if (hubId) {
        linkRows.push({
          topic_id: topic.id,
          entity_kind: "hub",
          entity_id: hubId,
          reason: "authored_for_hub",
          score: 70,
        })
      }
      if (meetupId) {
        linkRows.push({
          topic_id: topic.id,
          entity_kind: "meetup",
          entity_id: meetupId,
          reason: "authored_for_meetup",
          score: 70,
        })
      }
      if (linkRows.length > 0) {
        const { error: linkErr } = await supabase
          .from("forum_topic_entities")
          .insert(linkRows)
        if (linkErr) throw linkErr
      }

      onPost?.({ title: trimmedTitle, body: trimmedBody, category })
      setTitle("")
      setBody("")
      setLocation("")
      setTripStart("")
      setTripEnd("")
      router.refresh()
    } catch (err: any) {
      console.error("Error creating topic:", err)
      setError(err?.message || "Failed to post. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  // Helper function to extract time from title
  function extractTimeFromTitle(title: string): string | undefined {
    // Look for patterns like "3pm", "15:00", "3:00pm", etc.
    const timeRegex = /\b(\d{1,2})(:\d{2})?(\s*[ap]m)?\b/i
    const match = title.match(timeRegex)
    return match ? match[0] : undefined
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {section === "Trips" ? "Book a Trip" :
           section === "Meetups" ? "Plan a Meetup" :
           "Start a Discussion"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={p.title} />
          <Textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder={p.body} />
          {(section === "Meetups" || section === "Trips") && (
            <div className="relative">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <Input
                  ref={inputRef}
                  value={location}
                  onChange={handleLocationInputChange}
                  onFocus={() => {
                    setInputFocused(true)
                    if (locationSuggestions.length > 0) setShowSuggestions(true)
                  }}
                  onBlur={() => setInputFocused(false)}
                  placeholder={section === "Meetups" ? "Location (required for meetups)" : "Destination city (required for trips)"}
                  className="flex-1"
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
          )}
          {section === "Trips" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input 
                type="date" 
                value={tripStart}
                onChange={(e) => setTripStart(e.target.value)}
                placeholder="Start date"
              />
              <Input 
                type="date" 
                value={tripEnd}
                onChange={(e) => setTripEnd(e.target.value)}
                placeholder="End date"
              />
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MessageCircle className="h-4 w-4" /> Auto-category: <Badge variant="secondary">{section}</Badge>
            </div>
            <div className="flex items-center gap-2">
              {p.chips.map((chip) => (
                <Button key={chip} type="button" variant="outline" size="sm" className="cursor-pointer" onClick={() => setTitle((t) => t || chip)}>
                  {chip}
                </Button>
              ))}
              <Button type="submit" disabled={submitting || !title.trim() || !body.trim()} className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer">
                {submitting ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}


