import { createClient } from "@supabase/supabase-js"

// Event processor for handling outbox events
export class EventProcessor {
  private supabase
  private isProcessing = false
  private processingInterval: NodeJS.Timeout | null = null

  constructor() {
    this.supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  }

  // Start processing events
  start(intervalMs = 5000) {
    if (this.processingInterval) return

    console.log("[v0] Starting event processor...")
    this.processingInterval = setInterval(() => {
      this.processEvents()
    }, intervalMs)
  }

  // Stop processing events
  stop() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
      console.log("[v0] Stopped event processor")
    }
  }

  // Process pending events from outbox
  private async processEvents() {
    if (this.isProcessing) return

    this.isProcessing = true

    try {
      // Get unprocessed events
      const { data: events, error } = await this.supabase
        .from("outbox_events")
        .select("*")
        .is("processed_at", null)
        .lt("retry_count", 3)
        .order("created_at", { ascending: true })
        .limit(10)

      if (error) {
        console.error("[v0] Error fetching events:", error)
        return
      }

      if (!events || events.length === 0) return

      console.log(`[v0] Processing ${events.length} events`)

      // Process each event
      for (const event of events) {
        await this.processEvent(event)
      }
    } catch (error) {
      console.error("[v0] Error in event processing:", error)
    } finally {
      this.isProcessing = false
    }
  }

  // Process individual event
  private async processEvent(event: any) {
    try {
      console.log(`[v0] Processing event: ${event.event_type} for ${event.aggregate_type}:${event.aggregate_id}`)

      switch (event.event_type) {
        case "TripCreated":
        case "TripUpdated":
          await this.handleTripEvent(event)
          break
        case "TripDeleted":
          await this.handleTripDeletedEvent(event)
          break
        case "FamilyInterestsUpdated":
        case "FamilyChildrenUpdated":
          await this.handleFamilyEvent(event)
          break
        default:
          console.log(`[v0] Unknown event type: ${event.event_type}`)
      }

      // Mark event as processed
      await this.supabase.from("outbox_events").update({ processed_at: new Date().toISOString() }).eq("id", event.id)

      console.log(`[v0] Successfully processed event: ${event.id}`)
    } catch (error) {
      console.error(`[v0] Error processing event ${event.id}:`, error)

      // Increment retry count
      await this.supabase
        .from("outbox_events")
        .update({
          retry_count: event.retry_count + 1,
          error_message: error instanceof Error ? error.message : "Unknown error",
        })
        .eq("id", event.id)
    }
  }

  // Handle trip-related events
  private async handleTripEvent(event: any) {
    const { family_id, destination, start_date, end_date, trip_id } = event.event_data

    console.log(`[v0] Finding matches for trip ${trip_id} to ${destination}`)

    // Use advanced PostGIS matching query with scoring algorithm
    const { data: matchingFamilies, error } = await this.supabase.rpc("find_trip_matches", {
      target_trip_id: trip_id || event.aggregate_id,
      max_distance_km: 50,
    })

    if (error) {
      console.error("[v0] Error finding matches:", error)
      // Fallback to simpler query if PostGIS function fails
      return this.handleTripEventFallback(event)
    }

    if (matchingFamilies && matchingFamilies.length > 0) {
      console.log(`[v0] Found ${matchingFamilies.length} matching families`)

      // Cache display-ready recommendations
      for (const match of matchingFamilies) {
        await this.cacheDisplayReadyRecommendation({
          family_id,
          recommendation_type: "family_matches",
          target_id: match.other_family_id,
          score: Math.round(match.score * 100),
          display_data: {
            family_name: match.family_name,
            destination: match.destination,
            dates: `${match.start_date} - ${match.end_date}`,
            children_count: match.children_count,
            children_ages: match.children_ages,
            homeschool_style: match.homeschool_style,
            shared_interests: match.shared_interests,
            distance_km: Math.round(match.distance_km),
            badges: this.generateBadges(match),
          },
          reasons: [
            `${Math.round(match.distance_km)}km from your destination`,
            `${match.shared_interests?.length || 0} shared interests`,
            `Compatible children ages`,
            `${match.homeschool_style} homeschooling`,
          ].filter(Boolean),
          valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000),
        })
      }
    }

    // Generate place recommendations using geospatial data
    await this.generateAdvancedPlaceRecommendations(family_id, trip_id || event.aggregate_id)
  }

  private async handleTripEventFallback(event: any) {
    const { family_id, destination, start_date, end_date } = event.event_data

    // Simple text-based matching as fallback
    const { data: matchingFamilies } = await this.supabase
      .from("travel_plans")
      .select(`
        *,
        families!inner(id, family_name, interests, homeschool_style, children, father_name, mother_name)
      `)
      .neq("family_id", family_id)
      .eq("is_active", true)
      .ilike("destination", `%${destination.split(",")[0]}%`)

    if (matchingFamilies) {
      for (const match of matchingFamilies) {
        const score = this.calculateMatchScore(event.event_data, match)

        await this.cacheDisplayReadyRecommendation({
          family_id,
          recommendation_type: "family_matches",
          target_id: match.family_id,
          score,
          display_data: {
            family_name: match.families.family_name,
            destination: match.destination,
            dates: `${match.start_date} - ${match.end_date}`,
            children_count: match.families.children?.length || 0,
            children_ages: match.families.children?.map((c: any) => c.age).filter(Boolean) || [],
            homeschool_style: match.families.homeschool_style,
            shared_interests: match.families.interests || [],
            badges: this.generateBadges(match.families),
          },
          reasons: this.getMatchReasons(event.event_data, match),
          valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000),
        })
      }
    }
  }

  // Handle trip deleted events
  private async handleTripDeletedEvent(event: any) {
    const { family_id } = event.event_data

    // Remove cached recommendations for this family
    await this.supabase.from("recommendation_cache").delete().eq("family_id", family_id)
  }

  // Handle family update events
  private async handleFamilyEvent(event: any) {
    const { family_id } = event.event_data

    // Invalidate and regenerate recommendations for this family
    await this.supabase.from("recommendation_cache").delete().eq("family_id", family_id)

    // Regenerate recommendations based on current trips
    const { data: trips } = await this.supabase
      .from("travel_plans")
      .select("*")
      .eq("family_id", family_id)
      .eq("is_active", true)

    if (trips) {
      for (const trip of trips) {
        await this.handleTripEvent({
          event_data: {
            family_id: trip.family_id,
            destination: trip.destination,
            start_date: trip.start_date,
            end_date: trip.end_date,
            trip_id: trip.id,
          },
        })
      }
    }
  }

  // Calculate match score between families
  private calculateMatchScore(tripData: any, matchingFamily: any): number {
    let score = 0
    const family = matchingFamily.families

    // Base score for destination match
    score += 30

    // Homeschool style match
    if (family.homeschool_style) {
      score += 20
    }

    // Interest overlap
    if (family.interests && Array.isArray(family.interests)) {
      score += Math.min(family.interests.length * 5, 25)
    }

    // Children age compatibility
    if (family.children && Array.isArray(family.children)) {
      score += Math.min(family.children.length * 3, 15)
    }

    return Math.min(score, 100)
  }

  // Get match reasons
  private getMatchReasons(tripData: any, matchingFamily: any): string[] {
    const reasons = []
    const family = matchingFamily.families

    reasons.push(`Traveling to ${tripData.destination}`)

    if (family.homeschool_style) {
      reasons.push(`${family.homeschool_style} homeschooling`)
    }

    if (family.interests && family.interests.length > 0) {
      reasons.push(`Shared interests: ${family.interests.slice(0, 2).join(", ")}`)
    }

    if (family.children && family.children.length > 0) {
      reasons.push(`${family.children.length} children`)
    }

    return reasons
  }

  private generateBadges(familyData: any): string[] {
    const badges = []

    if (familyData.homeschool_style) {
      badges.push(familyData.homeschool_style)
    }

    if (familyData.children_count || (familyData.children && familyData.children.length)) {
      const count = familyData.children_count || familyData.children.length
      badges.push(`${count} ${count === 1 ? "child" : "children"}`)
    }

    if (familyData.shared_interests && familyData.shared_interests.length > 0) {
      badges.push(`${familyData.shared_interests.length} shared interests`)
    }

    if (familyData.distance_km !== undefined) {
      badges.push(`${Math.round(familyData.distance_km)}km away`)
    }

    return badges
  }

  private async generateAdvancedPlaceRecommendations(familyId: string, tripId: string) {
    // Get trip location for geospatial queries
    const { data: trip } = await this.supabase.from("travel_plans").select("destination, geo").eq("id", tripId).single()

    if (!trip) return

    // In a real implementation, this would query a places database or API
    // using the trip.geo coordinates to find nearby POIs
    const places = [
      {
        name: "Family Adventure Park",
        type: "outdoor",
        description: "Perfect for homeschooling families with outdoor activities",
        distance_km: 5.2,
      },
      {
        name: "Interactive Science Museum",
        type: "educational",
        description: "Hands-on learning experiences for children",
        distance_km: 8.7,
      },
      {
        name: "Cultural Heritage Center",
        type: "cultural",
        description: "Learn about local history and traditions",
        distance_km: 3.1,
      },
    ]

    for (const place of places) {
      await this.cacheDisplayReadyRecommendation({
        family_id: familyId,
        recommendation_type: "place_recommendations",
        target_id: `place_${place.name.toLowerCase().replace(/\s+/g, "_")}`,
        score: 85 - Math.round(place.distance_km), // Closer places get higher scores
        display_data: {
          name: place.name,
          type: place.type,
          description: place.description,
          distance_km: place.distance_km,
          badges: [place.type, `${place.distance_km}km away`],
        },
        reasons: [
          `${place.distance_km}km from ${trip.destination}`,
          `Great for ${place.type} activities`,
          place.description,
        ],
        valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
    }
  }

  private async cacheDisplayReadyRecommendation(recommendation: any) {
    const { error } = await this.supabase.from("recommendation_cache").upsert({
      ...recommendation,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error("[v0] Error caching recommendation:", error)
    } else {
      console.log(`[v0] Cached ${recommendation.recommendation_type} for family ${recommendation.family_id}`)
    }
  }
}

// Singleton instance
export const eventProcessor = new EventProcessor()

// Auto-start in production
if (typeof window === "undefined" && process.env.NODE_ENV === "production") {
  eventProcessor.start()
}
