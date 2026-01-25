"use client"

import { useState, useEffect, useRef } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MapPin, Users, MessageCircle } from "lucide-react"
import Link from "next/link"
import { getCurrentPosition, fetchLocationSuggestions, LocationSuggestion, normalizeCity, reverseGeocode } from "@/lib/locationUtils"
import { formatChildSummary } from "@/lib/childrenUtils"

interface FamilyProfile {
  id: string
  family_name: string
  kids_ages?: string
  children?: Array<{ name?: string; gender?: string; age?: number | string | null; birthdate?: string | null; birth_year?: number | null }>
  current_location: string | null
  standard_city?: string | null
  standard_country?: string | null
  current_until: string | null
  future_location: string | null
  future_from: string | null
  future_until: string | null
}

export default function FamilyList() {
  const [families, setFamilies] = useState<FamilyProfile[]>([])
  const [locationFilter, setLocationFilter] = useState("")
  const [nameFilter, setNameFilter] = useState("")
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<FamilyProfile | null>(null)
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null)
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const suggestionRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    console.log('Initial locationFilter:', locationFilter);
    async function fetchUserAndFamilies() {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        
        setCurrentUserId(user.id)
        
        // Get user's profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()
        
        setUserProfile(profile || null)
        
        // Set initial location filter from user's current location
        if (profile?.current_location) {
          setLocationFilter(profile.current_location)
        }
        
        // Fetch families with the initial filter, passing user ID to ensure exclusion
        await fetchFamilies(
          profile?.location_full_name || profile?.current_location || "",
          user.id,
          profile?.standard_city || undefined
        )
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchUserAndFamilies()
    
    // Try to get user's geolocation
    getUserLocation()
  }, [supabase])
  
  // Get user's current location and fetch nearby locations
  const getUserLocation = async () => {
    try {
      const position = await getCurrentPosition()
      setUserLocation(position)
      
      // Try to get the location name from coordinates
      const locationData = await reverseGeocode(position.latitude, position.longitude)
      console.log('Reverse geocode result:', locationData);

      // If we got a location name and no location filter is set, use it
      if (locationData && !locationFilter) {
        setLocationFilter(locationData.fullName)
        // Fetch families at this location
        fetchFamilies(locationData.fullName, currentUserId, locationData.standardCity)
      }
      
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
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null)
  
  const handleLocationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocationFilter(value)
    
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
  
  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    setLocationFilter(suggestion.fullName)
    setShowSuggestions(false)
    fetchFamilies(suggestion.fullName, currentUserId, suggestion.standardCity, nameFilter)
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
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout)
      }
    }
  }, [debounceTimeout])
  
  async function fetchFamilies(
    location: string,
    userId: string | null = currentUserId,
    standardCity?: string,
    name?: string
  ) {
    try {
      setLoading(true)

      let query = supabase.from("profiles").select("*")

      if (userId) query = query.neq("id", userId)

      const city =
        (standardCity || location || "")
          .toLowerCase()
          .split(",")[0]
          .trim();

      if (city) {
        query = query.or(
          [
            `standard_city.eq.${city}`,
            `location_label_search.like.%${city}%`,
          ].join(",")
        )
      }

      const normalizedName = name?.trim()
      if (normalizedName) {
        // Case-insensitive search on family_name
        query = query.ilike("family_name", `%${normalizedName}%`)
      }

      const { data, error } = await query.order("updated_at", { ascending: false })
      if (error) {
        console.error("Error fetching families:", error);
        return;
      }

      console.log('Family list query result:', {
        location,
        userId,
        standardCity,
        normalizedCity: city,
        name,
        resultCount: data?.length || 0,
        results: data
      });

      setFamilies(data || [])
    } finally {
      setLoading(false)
    }
  }
  
  function handleSearch() {
    setShowSuggestions(false)
    // Use both filters; any of them can be empty
    fetchFamilies(locationFilter, currentUserId, undefined, nameFilter)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 space-y-2">
          <label htmlFor="locationFilter" className="text-sm font-medium text-gray-700">
            Filter by Location
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="locationFilter"
                ref={inputRef}
                value={locationFilter}
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
                placeholder="Enter city, country"
                className="pl-9"
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
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <Button onClick={handleSearch} className="bg-emerald-600 hover:bg-emerald-700">
              Search
            </Button>
          </div>

          <div className="space-y-1">
            <label htmlFor="nameFilter" className="text-sm font-medium text-gray-700">
              Or search by family name
            </label>
            <Input
              id="nameFilter"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              placeholder="e.g. Smith, Oliveira"
            />
            <p className="text-xs text-gray-500">
              You can combine location + surname, or leave one blank.
            </p>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-500">Loading families...</p>
        </div>
      ) : families.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium mb-2">No families found</h3>
            <p className="text-gray-500 mb-4">
              {locationFilter || nameFilter
                ? "No families match those filters. Try adjusting the location or surname."
                : "Try searching by location or family name."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {families.map((family) => (
            <Card key={family.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">{family.family_name}</h3>
                      <div className="flex items-center text-gray-500 text-sm mt-1">
                        <Users className="h-3.5 w-3.5 mr-1" />
                        <span>
                          {Array.isArray(family.children) && family.children.length > 0
                            ? (() => {
                                const parts = family.children
                                  .map((c) => formatChildSummary(c))
                                  .filter((entry): entry is string => Boolean(entry))
                                return parts.length > 0 ? `Kids: ${parts.join(", ")}` : `Kids: ${family.children?.length === 1 ? "1 kid" : `${family.children?.length || 0} kids`}`
                              })()
                            : `Kids: ${family.kids_ages || "Not specified"}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/families/${family.id}`}>
                        <Button variant="outline" size="sm">
                          View Profile
                        </Button>
                      </Link>
                      <Link href={`/chat/${family.id}`}>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                      </Link>
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    {family.current_location && (
                      <div className="flex items-start">
                        <MapPin className="h-4 w-4 text-emerald-500 mt-0.5 mr-2 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">
                            In {family.current_location}
                            {family.current_until && (
                              <span className="font-normal"> until {new Date(family.current_until).toLocaleDateString()}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {family.future_location && (
                      <div className="flex items-start">
                        <MapPin className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">
                            Going to {family.future_location}
                            {family.future_from && family.future_until && (
                              <span className="font-normal"> from {new Date(family.future_from).toLocaleDateString()} to {new Date(family.future_until).toLocaleDateString()}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

