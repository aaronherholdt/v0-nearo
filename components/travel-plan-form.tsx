"use client"

import { useActionState } from "react"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { useFormStatus } from "react-dom"
import { createTravelPlan, updateTravelPlan } from "@/lib/supabaseClient"
import { Switch } from "@/components/ui/switch"
import { MapPin } from "lucide-react"
import { getCurrentPosition, fetchLocationSuggestions, LocationSuggestion } from "@/lib/locationUtils"

type TravelPlanFormProps = {
  initialData?: {
    id: string
    title: string
    description?: string
    destination: string
    latitude?: number | null
    longitude?: number | null
    start_date: string
    end_date: string
    is_active: boolean
  }
  isEdit?: boolean
}

function SubmitButton({ isEdit }: { isEdit?: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
      {pending ? (isEdit ? "Saving changes..." : "Creating trip...") : isEdit ? "Save Changes" : "Create Trip"}
    </Button>
  )
}

export default function TravelPlanForm({ initialData, isEdit }: TravelPlanFormProps) {
  const [state, formAction] = useActionState(isEdit ? updateTravelPlan : createTravelPlan, null)
  const [destination, setDestination] = useState(initialData?.destination || "")
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null)
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null)
  const suggestionRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Get user's current location when component mounts
  useEffect(() => {
    getUserLocation()
    
    // Clean up timeout on unmount
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout)
      }
    }
  }, [debounceTimeout])
  
  // Get user's current location and fetch nearby locations
  const getUserLocation = async () => {
    try {
      const position = await getCurrentPosition()
      setUserLocation(position)
      
      // Fetch initial location suggestions based on user's position
      fetchNearbySuggestions(position)
    } catch (error) {
      console.error("Error getting user location:", error)
    }
  }
  
  // Fetch nearby location suggestions
  const fetchNearbySuggestions = async (position: {latitude: number, longitude: number}) => {
    try {
      setSuggestionsLoading(true)
      const suggestions = await fetchLocationSuggestions("", position)
      setLocationSuggestions(suggestions)
    } catch (error) {
      console.error("Error fetching nearby locations:", error)
    } finally {
      setSuggestionsLoading(false)
    }
  }
  
  // Handle location input change with debounce
  const handleLocationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setDestination(value)
    
    // Clear previous timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout)
    }
    
    // Set new timeout
    const timeout = setTimeout(async () => {
      if (value.length > 0) {
        setSuggestionsLoading(true)
        try {
          const suggestions = await fetchLocationSuggestions(value, userLocation || undefined)
          setLocationSuggestions(suggestions)
          setShowSuggestions(true)
        } catch (error) {
          console.error("Error fetching location suggestions:", error)
        } finally {
          setSuggestionsLoading(false)
        }
      } else {
        // If input is empty, fetch nearby locations
        if (userLocation) {
          fetchNearbySuggestions(userLocation)
          setShowSuggestions(inputFocused)
        } else {
          setLocationSuggestions([])
          setShowSuggestions(false)
        }
      }
    }, 300) // 300ms debounce
    
    setDebounceTimeout(timeout)
  }
  
  // Store standardized location data when selecting a suggestion
  const [selectedStandardCity, setSelectedStandardCity] = useState<string | null>(null)
  const [selectedStandardCountry, setSelectedStandardCountry] = useState<string | null>(null)
  const [selectedLocationLat, setSelectedLocationLat] = useState<number | null>(null)
  const [selectedLocationLng, setSelectedLocationLng] = useState<number | null>(null)
  
  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    setDestination(suggestion.fullName)
    setSelectedStandardCity(suggestion.standardCity)
    setSelectedStandardCountry(suggestion.standardCountry)
    setSelectedLocationLat(suggestion.lat)
    setSelectedLocationLng(suggestion.lon)
    setShowSuggestions(false)
  }
  
  // Close suggestions when clicking outside
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Edit Trip" : "Create a Trip"}</CardTitle>
          <CardDescription>Set a destination and dates so other families can match with you.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-6">
            {state?.error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{state.error}</div>
            )}
            {state?.success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                {state.success}
              </div>
            )}

            {isEdit && initialData?.id && <input type="hidden" name="id" value={initialData.id} />}

            {/* Hidden inputs for standardized location data */}
            {selectedStandardCity && <input type="hidden" name="standard_city" value={selectedStandardCity} />}
            {selectedStandardCountry && <input type="hidden" name="standard_country" value={selectedStandardCountry} />}
            {selectedLocationLat && <input type="hidden" name="location_lat" value={selectedLocationLat.toString()} />}
            {selectedLocationLng && <input type="hidden" name="location_lng" value={selectedLocationLng.toString()} />}

            <div className="space-y-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">Trip Title *</label>
              <Input id="title" name="title" placeholder="Summer in Paris" defaultValue={initialData?.title || ""} required />
            </div>

            <div className="space-y-2">
              <label htmlFor="destination" className="block text-sm font-medium text-gray-700">Destination *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="destination"
                  ref={inputRef}
                  name="destination"
                  value={destination}
                  onChange={handleLocationInputChange}
                  onFocus={() => {
                    setInputFocused(true)
                    // Only show suggestions if we have some or if we're loading them
                    if (locationSuggestions.length > 0 || suggestionsLoading) {
                      setShowSuggestions(true)
                    }
                  }}
                  onBlur={() => {
                    setInputFocused(false)
                    // Delay hiding suggestions to allow for clicks
                    setTimeout(() => {
                      if (!inputFocused) {
                        setShowSuggestions(false)
                      }
                    }, 200)
                  }}
                  placeholder="Paris, France"
                  className="w-full pl-9"
                  required
                />
                
                {/* Location suggestions dropdown */}
                {showSuggestions && (
                  <div 
                    ref={suggestionRef}
                    className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm border border-gray-200"
                  >
                    {suggestionsLoading ? (
                      <div className="text-center py-2">
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-emerald-500 border-t-transparent"></div>
                        <p className="text-xs text-gray-500 mt-1">Loading suggestions...</p>
                      </div>
                    ) : locationSuggestions.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        No locations found
                      </div>
                    ) : (
                      locationSuggestions.map((suggestion) => (
                        <div
                          key={suggestion.id}
                          className="cursor-pointer hover:bg-gray-100 py-2 px-3"
                          onMouseDown={() => handleSelectSuggestion(suggestion)}
                        >
                          <div className="flex items-start">
                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium">{suggestion.fullName}</p>
                              {suggestion.distance !== undefined && (
                                <p className="text-xs text-gray-500">
                                  {suggestion.distance < 1 
                                    ? 'Nearby' 
                                    : `${Math.round(suggestion.distance)} km away`}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">From *</label>
                <DatePicker name="start_date" defaultValue={initialData?.start_date ? new Date(initialData.start_date) : undefined} />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Until *</label>
                <DatePicker name="end_date" defaultValue={initialData?.end_date ? new Date(initialData.end_date) : undefined} />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
              <Textarea id="description" name="description" placeholder="Optional details..." defaultValue={initialData?.description || ""} rows={3} />
            </div>

            <div className="flex items-center gap-3">
              <Switch id="is_active" name="is_active" defaultChecked={initialData?.is_active ?? true} />
              <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
            </div>

            <SubmitButton isEdit={isEdit} />
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


