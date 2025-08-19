"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function generateRecommendationsForExistingTrips() {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    // Get all travel plans that don't have cached recommendations
    const { data: travelPlans } = await supabase.from("travel_plans").select(`
        id,
        family_id,
        destination,
        latitude,
        longitude,
        families!inner(
          id,
          interests,
          children
        )
      `)

    if (!travelPlans) return

    for (const plan of travelPlans) {
      // Check if recommendations already exist
      const { data: existingRecs } = await supabase
        .from("recommendation_cache")
        .select("id")
        .eq("family_id", plan.family_id)
        .eq("recommendation_type", "place")
        .limit(1)

      if (existingRecs && existingRecs.length > 0) continue

      const { data: places } = await supabase.rpc("get_global_place_recommendations", {
        destination_city: plan.destination,
        destination_country: null,
        family_interests: plan.families.interests || [],
        children_ages: plan.families.children?.map((child: any) => child.age) || [],
        limit_count: 5,
      })

      if (places && places.length > 0) {
        const recommendations = places.map((place: any) => ({
          family_id: plan.family_id,
          recommendation_type: "place",
          target_id: place.place_id,
          score: place.match_score || 80,
          reasons: {
            name: place.place_name,
            description: place.description,
            category: place.category,
            rating: place.rating,
            price_level: place.price_level,
            address: place.address,
            destination: plan.destination,
            interests: place.interests,
            tags: place.tags,
          },
          valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }))

        await supabase.from("recommendation_cache").insert(recommendations)
      }
    }

    console.log("Successfully generated recommendations for existing trips")
  } catch (error) {
    console.error("Failed to generate recommendations for existing trips:", error)
  }
}
