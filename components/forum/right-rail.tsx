"use client"

import { useMemo, useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, MapPin, Users, Plane, MessageCircle, User } from "lucide-react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { deriveAgeFromChild } from "@/lib/childrenUtils"

// add near top
const normalizeCity = (s?: string | null) =>
  s
    ? s.split(",")[0]
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
    : ""

type Meetup = {
  id: string;
  title: string;
  place_id: string;
  time: string;
  created_at: string;
  meetup_date: string;  
  meetup_status: string;
}

type FamilyMatch = {
  id: string;
  family_name: string;
  avatar_url?: string;
  match_type: 'resident' | 'visitor';
  match_score: number; // 0-100 score based on age match
  children: Array<{ age?: number; birthdate?: string | null; birth_year?: number | null }>;
  location: string;
  visit_dates?: { start: string; end: string }; // For visitors
  distance_km?: number; // For residents
}

type TripMatch = {
  id: string;
  title: string;
  family_name: string;
  avatar_url?: string;
  destination: string;
  start_date: string;
  end_date: string;
  kids_ages: number[];
}

const toAgeArray = (children: any): number[] =>
  Array.isArray(children)
    ? (children as any[])
        .map((child: any) => deriveAgeFromChild(child))
        .filter((age): age is number => age !== null)
    : []

// Helper function to format date range in a readable format
function formatDateRange(start: string, end: string): string {
  if (!start || !end) return ''
  
  const startDate = new Date(start)
  const endDate = new Date(end)
  
  // Format: "Sep 12-26" or "Sep 12 - Oct 3"
  const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' })
  const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' })
  const startDay = startDate.getDate()
  const endDay = endDate.getDate()
  
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}`
  } else {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`
  }
}

export default function RightRail() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [nearbyMeetups, setNearbyMeetups] = useState<Meetup[]>([])
  const [familyMatches, setFamilyMatches] = useState<FamilyMatch[]>([])
  const [tripMatches, setTripMatches] = useState<TripMatch[]>([])
  const [loading, setLoading] = useState(true)

  const section = useMemo(() => {
    if (pathname?.startsWith("/forum/trips")) return "Trips"
    if (pathname?.startsWith("/forum/meetups")) return "Meetups"
    if (pathname?.startsWith("/hubs")) return "Hubs"
    return "General"
  }, [pathname])

  // Hide content on edit pages to keep focus on the edit form
  const isEditPage = pathname?.includes("/edit")

  if (isEditPage) {
    return null
  }
  
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        
        // Get current user's profile to determine location and children's ages
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('standard_city, standard_country, children, location_lat, location_lng, location_full_name, current_location, match_prefs')
          .eq('id', user.id)
          .single()

        // inside fetchData(), after you load `profile`:
        const tripsViewMin = Number(profile?.match_prefs?.trips_view?.min_km ?? 0)
        const tripsViewMax = Number(profile?.match_prefs?.trips_view?.max_km ?? 200)

        const cityKey = normalizeCity(
          profile?.standard_city || profile?.location_full_name || profile?.current_location
        )
        if (!cityKey) return
        
        // Extract user's children ages for matching
        const userChildrenAges = toAgeArray(profile?.children)

        const userLat = profile?.location_lat
        const userLng = profile?.location_lng
        const radiusKm = 50

        // Meetups (server filters by meetups_view ring)
        const { data: rpcMeetups, error: meetupErr } =
          await supabase.rpc('nearby_meetups', { _user: user.id })
        if (meetupErr) console.error('nearby_meetups', meetupErr)
        const currentDate = new Date().toISOString().split('T')[0];

        const validMeetups = (rpcMeetups ?? []).map((m: any) => ({
          id: String(m.id),
          title: m.title,
          place_id: m.place_id || '',
          created_at: m.created_at,
          distance_km: m.distance_km ?? undefined,
          meetup_date: m.meetup_date,
          meetup_status: m.meetup_status,
        }))
          .filter((m: any) => m.meetup_date >= currentDate && m.meetup_status === 'upcoming')
          .sort((a: any, b: any) => new Date(a.meetup_date).getTime() - new Date(b.meetup_date).getTime())
          .slice(0, 3);

        setNearbyMeetups(validMeetups);

        if (!userLat || !userLng) {
          setFamilyMatches([])
          setLoading(false)
          return
        }

        /* === REPLACE the old "profiles" fetch + local filtering with this RPC call === */

        const { data: rpcFamilies, error: famErr } = await supabase
          .rpc('nearby_families', { _user: user.id, _mutual: false })

        if (famErr) console.error('nearby_families error:', famErr)

        // Build resident matches from RPC rows and compute age-match score (same logic as dashboard)
        const processedFamilies: FamilyMatch[] = (rpcFamilies || []).map((f: any) => {
          const familyChildrenAges = toAgeArray(f.children)

          const matchScore = calculateAgeMatchScore(userChildrenAges, familyChildrenAges)
          const label = f.location_full_name || f.current_location || f.standard_city || 'Unknown'

          return {
            id: f.id,
            family_name: f.family_name || 'Family',
            avatar_url: f.avatar_url || f.family_photo_url || '', // map RPC field to rail avatar
            match_type: 'resident',
            match_score: matchScore,
            children: Array.isArray(f.children) ? f.children : [],
            location: label,
            distance_km: typeof f.distance_km === 'number' ? f.distance_km : undefined,
          } as FamilyMatch
        })

        /* === keep the visitors (trip) logic that follows exactly as you have it === */

        // 3. Fetch families with upcoming trips to user's location (within radius)
        const today = new Date().toISOString().split('T')[0]
        const { data: allTrips } = await supabase
          .from('forum_topics')
          .select('id, title, author_id, author_family_name, meta, created_at')
          .eq('category', 'trips')
          .not('meta->>lat', 'is', null)
          .not('meta->>lng', 'is', null)
          .order('created_at', { ascending: false })
          .limit(50)

        const upcomingVisitors = (allTrips || [])
          .filter((trip: any) => {
            const tripLat = Number(trip.meta?.lat)
            const tripLng = Number(trip.meta?.lng)
            if (!tripLat || !tripLng || !userLat || !userLng) return false

            const distance = calculateDistance(userLat, userLng, tripLat, tripLng)
            return distance >= tripsViewMin && distance <= tripsViewMax
          })
        
        // Process visitors (families with trips to user's location)
        // Only include trips that are still active or upcoming by end or start date
        const activeUpcomingVisitors = (upcomingVisitors || []).filter((trip: any) => {
          const start = String(trip?.meta?.start || '')
          const end = String(trip?.meta?.end || '')
          return (end && end >= today) || (start && start >= today)
        })

        const processedVisitors = await Promise.all(activeUpcomingVisitors.map(async (trip) => {
          // Get visitor profile to get their children's ages
          const { data: visitorProfile } = await supabase
            .from('profiles')
            .select('id, family_name, avatar_url, children')
            .eq('id', trip.author_id)
            .single()
          
          if (!visitorProfile) return null
          
          const visitorChildrenAges = toAgeArray(visitorProfile.children)
          
          // If you later persist kids_ages in columns, swap here
          const tripKidsAges = visitorChildrenAges
          
          // Calculate match score based on minimum age gap
          const matchScore = calculateAgeMatchScore(userChildrenAges, tripKidsAges)
          
          return {
            id: visitorProfile.id,
            family_name: trip.author_family_name || visitorProfile.family_name || 'Family',
            avatar_url: visitorProfile.avatar_url,
            match_type: 'visitor',
            match_score: matchScore,
            children: Array.isArray(visitorProfile.children) ? visitorProfile.children : [],
            location: 'Visiting ' + (profile?.standard_city || cityKey),
            visit_dates: { start: String(trip?.meta?.start || ''), end: String(trip?.meta?.end || '') }
          } as FamilyMatch
        }))
        
        // Merge resident + visitor matches, sort by score, limit to 5 (same as before)
        const allMatches = [
          ...processedFamilies,
          ...(processedVisitors.filter(Boolean) as FamilyMatch[]),
        ]

        const sortedMatches = allMatches.sort((a, b) => b.match_score - a.match_score).slice(0, 5)
        
        setFamilyMatches(sortedMatches)
        
        // Trips (server filters by trips_view ring)
        const { data: rpcTrips, error: tripsErr } =
          await supabase.rpc('nearby_trips', { _user: user.id })
        if (tripsErr) console.error('nearby_trips', tripsErr)
        setTripMatches((rpcTrips ?? []).map((t: any) => ({
          id: String(t.id),
          title: t.title,
          destination: t.place_id || 'Unknown destination',
          start_date: t.starts_on || '',
          end_date: '',
          kids_ages: [],
        })).slice(0, 5))
      } catch (error) {
        console.error('Error fetching smart matches:', error)
      } finally {
        setLoading(false)
      }
    }
    
    // Helper function to calculate age match score between two sets of children ages
    function calculateAgeMatchScore(userAges: number[], otherAges: number[]): number {
      if (!userAges.length || !otherAges.length) return 0
      
      // Find minimum age gap between any two children
      let minGap = Infinity
      for (const userAge of userAges) {
        for (const otherAge of otherAges) {
          const gap = Math.abs(userAge - otherAge)
          minGap = Math.min(minGap, gap)
        }
      }
      
      // Convert gap to score (0-100)
      if (minGap === 0) return 100 // Exact match
      if (minGap <= 1) return 90 // Within 1 year
      if (minGap <= 2) return 80 // Within 2 years
      if (minGap <= 3) return 70 // Within 3 years
      if (minGap <= 5) return 50 // Within 5 years
      return Math.max(0, 40 - (minGap - 5) * 4) // Decreasing score for larger gaps
    }
    
    // Helper function to calculate distance between two points using Haversine formula
    function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
      const R = 6371 // Radius of the earth in km
      const dLat = deg2rad(lat2 - lat1)
      const dLon = deg2rad(lon2 - lon1)
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
      const distance = R * c // Distance in km
      return Math.round(distance * 10) / 10 // Round to 1 decimal place
    }
    
    function deg2rad(deg: number): number {
      return deg * (Math.PI/180)
    }
    
    let channel: any
    ;(async () => {
      await fetchData()
      
      // --- Realtime subscriptions (tiny, safe) ---
      channel = supabase.channel('smart-rail')
        // new/updated trips or meetups anywhere
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'forum_topics', filter: "category=in.(trips,meetups)" },
          async () => { await fetchData() }
        )
        // profile updates (e.g., family moves into your city or updates children)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles' },
          async () => { await fetchData() }
        )
        .subscribe()
    })()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [supabase])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Family Matches</CardTitle>
        </CardHeader>
        <CardContent className={`space-y-3 ${familyMatches.length >= 2 ? "max-h-96 overflow-y-auto" : ""}`}>
          {loading ? (
            <div className="text-sm text-gray-500">Finding matches near you...</div>
          ) : familyMatches.length > 0 ? (
            <div className="space-y-3">
              <div className="text-sm font-medium">Families near you</div>
              {familyMatches.map(family => (
                <div key={family.id} className="flex flex-col gap-3 p-3 border rounded-md">
                  {/* Top: Image and family name */}
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      {family.avatar_url ? (
                        <AvatarImage src={family.avatar_url} alt={family.family_name} />
                      ) : (
                        <AvatarFallback>{family.family_name.substring(0, 2)}</AvatarFallback>
                      )}
                    </Avatar>
                    <div className="font-medium truncate">{family.family_name}</div>
                  </div>

                  {/* Middle: Location and badges */}
                  <div className="flex flex-col gap-2">
                    <div className="text-xs text-gray-600">
                      {family.match_type === 'resident' ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {family.distance_km ? `${family.distance_km}km away` : 'Nearby'}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Plane className="h-3 w-3" />
                          {family.visit_dates && formatDateRange(family.visit_dates.start, family.visit_dates.end)}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {family.match_score >= 80 && (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                          Strong age match
                        </Badge>
                      )}
                      {family.match_score >= 50 && family.match_score < 80 && (
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                          Good age match
                        </Badge>
                      )}
                      {family.match_score < 50 && (
                        <Badge variant="secondary">
                          Age {family.match_score > 30 ? 'match' : 'gap'}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Bottom: Buttons */}
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/families/${family.id}`)}
                      className="flex items-center gap-1 flex-1"
                    >
                      <User className="h-3 w-3" /> Profile
                    </Button>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer flex items-center gap-1 flex-1"
                      onClick={() => router.push(`/chat/${family.id}`)}
                    >
                      <MessageCircle className="h-3 w-3" /> Message
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              No family matches found in your area. Try updating your location in profile settings.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Meetups</CardTitle>
        </CardHeader>
        <CardContent className={`space-y-2 ${nearbyMeetups.length >= 2 ? "max-h-96 overflow-y-auto" : ""}`}>
          {loading ? (
            <div className="text-sm text-gray-500">Loading meetups...</div>
          ) : nearbyMeetups.length > 0 ? (
            nearbyMeetups.map(meetup => (
              <div key={meetup.id} className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    {meetup.title}
                  </div>
                  {meetup.place_id && (
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <MapPin className="h-3 w-3" />
                      {meetup.place_id}
                    </div>
                  )}
                </div>
                <Button 
                  size="sm" 
                  className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                  onClick={() => router.push(`/forum/thread/${meetup.id}`)}
                >
                  See Meetup
                </Button>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-600">No upcoming meetups in your area.</div>
          )}
          <div className="text-xs text-gray-600">Create meetups in the Meetups category.</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Trip Matches</CardTitle>
        </CardHeader>
        <CardContent className={`space-y-2 ${tripMatches.length >= 2 ? "max-h-96 overflow-y-auto" : ""}`}>
          {loading ? (
            <div className="text-sm text-gray-500">Loading trips...</div>
          ) : tripMatches.length > 0 ? (
            tripMatches.map(trip => (
              <div key={trip.id} className="flex items-center justify-between p-2 border rounded-md">
                <div>
                  <div className="font-medium">{trip.title}</div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-gray-600 flex items-center gap-1">
                      <Plane className="h-3 w-3" /> 
                      {trip.destination} · {formatDateRange(trip.start_date, trip.end_date)}
                    </div>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Users className="h-3 w-3" /> {trip.family_name}
                    </Badge>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                  onClick={() => router.push(`/forum/thread/${trip.id}`)}
                >
                  View Trip
                </Button>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-600">No trip matches.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function RightItem({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-start justify-between p-2 border rounded-md">
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-xs text-gray-600">{subtitle}</div>
      </div>
      <Button size="sm" variant="outline" className="cursor-pointer">View</Button>
    </div>
  )
}

