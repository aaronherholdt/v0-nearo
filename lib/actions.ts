"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function signInWithGoogle() {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
    },
  })

  if (error) {
    console.error("Google OAuth error:", error)
    return
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function signIn(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.toString(),
      password: password.toString(),
    })

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Login error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function signUp(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const { error } = await supabase.auth.signUp({
      email: email.toString(),
      password: password.toString(),
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
          `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
      },
    })

    if (error) {
      return { error: error.message }
    }

    return { success: "Check your email to confirm your account." }
  } catch (error) {
    console.error("Sign up error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function signOut() {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })
  await supabase.auth.signOut()
  redirect("/auth/login")
}

export async function createFamilyProfile(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be logged in to create a family profile" }
  }

  const familyName = formData.get("familyName")
  const fatherName = formData.get("fatherName")
  const motherName = formData.get("motherName")
  const childrenData = formData.get("children")
  const bio = formData.get("bio")
  const homeschoolStyle = formData.get("homeschoolStyle")
  const interests = formData.get("interests")
  const familyPhoto = formData.get("familyPhoto") as File
  const homeLocation = formData.get("homeLocation")
  const radiusPreference = formData.get("radiusPreference")

  if (!familyName || (!fatherName && !motherName)) {
    return { error: "Family name and at least one parent name are required" }
  }

  let children = []
  if (childrenData) {
    try {
      children = JSON.parse(childrenData.toString())
      if (!Array.isArray(children) || children.length === 0) {
        return { error: "At least one child is required" }
      }

      for (const child of children) {
        if (!child.name || !child.gender || !child.age) {
          return { error: "Each child must have a name, gender, and age" }
        }
      }
    } catch (error) {
      return { error: "Invalid children data format" }
    }
  } else {
    return { error: "At least one child is required" }
  }

  try {
    const familyPhotoUrl = null
    // Photo upload disabled until database is properly set up

    const interestsArray = interests
      ? interests
          .toString()
          .split(",")
          .map((interest) => interest.trim())
          .filter((interest) => interest.length > 0)
      : []

    // Check if family profile already exists
    const { data: existingFamily } = await supabase.from("families").select("id").eq("user_id", user.id).single()

    if (existingFamily) {
      // Update existing family profile
      const { error } = await supabase
        .from("families")
        .update({
          family_name: familyName.toString(),
          father_name: fatherName?.toString() || null,
          mother_name: motherName?.toString() || null,
          bio: bio?.toString() || null,
          children: children,
          homeschool_style: homeschoolStyle?.toString() || null,
          interests: interestsArray,
          family_photo_url: familyPhotoUrl,
          home_location_name: homeLocation?.toString() || null,
          radius_preference: radiusPreference ? parseInt(radiusPreference.toString(), 10) : null,
        })
        .eq("id", existingFamily.id)

      if (error) {
        return { error: `Database error: ${error.message}` }
      }
    } else {
      // Create new family profile
      const { error } = await supabase.from("families").insert({
        user_id: user.id,
        family_name: familyName.toString(),
        father_name: fatherName?.toString() || null,
        mother_name: motherName?.toString() || null,
        bio: bio?.toString() || null,
        children: children,
        homeschool_style: homeschoolStyle?.toString() || null,
        interests: interestsArray,
        family_photo_url: familyPhotoUrl,
        home_location_name: homeLocation?.toString() || null,
        radius_preference: radiusPreference ? parseInt(radiusPreference.toString(), 10) : null,
      })

      if (error) {
        if (error.message.includes("relation") && error.message.includes("does not exist")) {
          return { error: "Database tables not found. Please run the migration scripts to set up the database." }
        }
        if (error.message.includes("row-level security policy")) {
          return {
            error:
              "Database permissions not configured. Please run the migration scripts to set up proper access policies.",
          }
        }
        return { error: `Database error: ${error.message}` }
      }
    }

    revalidatePath("/")
  } catch (error) {
    console.error("Create family profile error:", error)
    if (error instanceof Error) {
      if (error.message.includes("Failed to fetch")) {
        return { error: "Unable to connect to database. Please check your internet connection and try again." }
      }
      return { error: `Profile creation failed: ${error.message}` }
    }
    return { error: "An unexpected error occurred. Please try again." }
  }

  redirect("/")
}

export async function createTravelPlan(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be logged in to create a travel plan" }
  }

  const { data: family } = await supabase.from("families").select("id").eq("user_id", user.id).single()

  if (!family) {
    return { error: "Family profile not found" }
  }

  const title = formData.get("title")
  const description = formData.get("description")
  const destination = formData.get("destination")
  const latitude = formData.get("latitude")
  const longitude = formData.get("longitude")
  const startDate = formData.get("start_date")
  const endDate = formData.get("end_date")
  const isActive = formData.get("is_active") === "on"

  if (!title || !destination || !startDate || !endDate) {
    return { error: "Title, destination, start date, and end date are required" }
  }

  try {
    const lat = latitude && latitude.toString().trim() !== "" ? Number.parseFloat(latitude.toString()) : 0
    const lng = longitude && longitude.toString().trim() !== "" ? Number.parseFloat(longitude.toString()) : 0

    const start = new Date(startDate.toString())
    const end = new Date(endDate.toString())

    if (end <= start) {
      return { error: "End date must be after start date" }
    }

    const { data: travelPlan, error: insertError } = await supabase
      .from("travel_plans")
      .insert({
        family_id: family.id,
        title: title.toString(),
        description: description?.toString() || null,
        destination: destination.toString(),
        latitude: lat,
        longitude: lng,
        start_date: startDate.toString(),
        end_date: endDate.toString(),
        is_active: isActive,
      })
      .select()
      .single()

    if (insertError) {
      return { error: insertError.message }
    }

    const { error: eventError } = await supabase.from("outbox_events").insert({
      event_type: "TripCreated",
      aggregate_id: travelPlan.id,
      aggregate_type: "travel_plan",
      event_data: {
        travel_plan_id: travelPlan.id,
        family_id: family.id,
        destination: destination.toString(),
        latitude: lat,
        longitude: lng,
        start_date: startDate.toString(),
        end_date: endDate.toString(),
      },
    })

    if (eventError) {
      console.error("Failed to write event to outbox:", eventError)
      // Don't fail the entire operation, just log the error
    }

    await generatePlaceRecommendations(family.id, travelPlan.id, destination.toString(), lat, lng)

    revalidatePath("/travel-plans")
    revalidatePath("/")
  } catch (error) {
    console.error("Create travel plan error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }

  redirect("/travel-plans")
}

async function generatePlaceRecommendations(
  familyId: string,
  travelPlanId: string,
  destination: string,
  latitude: number,
  longitude: number,
) {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const { data: family } = await supabase.from("families").select("interests, children").eq("id", familyId).single()

    if (!family) return

    const { data: places } = await supabase.rpc("get_global_place_recommendations", {
      destination_city: destination,
      destination_country: null,
      family_interests: family.interests || [],
      children_ages: family.children?.map((child: any) => child.age) || [],
      limit_count: 5,
    })

    if (places && places.length > 0) {
      const recommendations = places.map((place: any) => ({
        family_id: familyId,
        recommendation_type: "place",
        target_id: place.place_id,
        score: place.match_score || 80,
        reasons: {
          name: place.place_name,
          description: place.description,
          category: place.category,
          rating: place.rating,
          address: place.address,
          destination: destination,
          interests: place.interests,
          tags: place.tags,
        },
        valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      }))

      await supabase.from("recommendation_cache").insert(recommendations)
    }
  } catch (error) {
    console.error("Failed to generate place recommendations:", error)
  }
}

export async function acceptMatch(formData: FormData) {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be logged in" }
  }

  const family1Id = formData.get("family1_id")
  const family2Id = formData.get("family2_id")
  const travelPlan1Id = formData.get("travel_plan1_id")
  const travelPlan2Id = formData.get("travel_plan2_id")

  if (!family1Id || !family2Id || !travelPlan1Id || !travelPlan2Id) {
    return { error: "Missing required match information" }
  }

  try {
    const { data: existingMatch } = await supabase
      .from("matches")
      .select("id, status")
      .or(
        `and(family1_id.eq.${family1Id},family2_id.eq.${family2Id}),and(family1_id.eq.${family2Id},family2_id.eq.${family1Id})`,
      )
      .single()

    if (existingMatch) {
      const { error } = await supabase.from("matches").update({ status: "accepted" }).eq("id", existingMatch.id)

      if (error) {
        return { error: error.message }
      }
    } else {
      const { error } = await supabase.from("matches").insert({
        family1_id: family1Id.toString(),
        family2_id: family2Id.toString(),
        travel_plan1_id: travelPlan1Id.toString(),
        travel_plan2_id: travelPlan2Id.toString(),
        status: "pending",
        match_score: 85,
      })

      if (error) {
        return { error: error.message }
      }
    }

    revalidatePath("/matches")
    return { success: "Match request sent!" }
  } catch (error) {
    console.error("Accept match error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function declineMatch(formData: FormData) {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be logged in" }
  }

  const family1Id = formData.get("family1_id")
  const family2Id = formData.get("family2_id")
  const travelPlan1Id = formData.get("travel_plan1_id")
  const travelPlan2Id = formData.get("travel_plan2_id")

  if (!family1Id || !family2Id || !travelPlan1Id || !travelPlan2Id) {
    return { error: "Missing required match information" }
  }

  try {
    const { data: existingMatch } = await supabase
      .from("matches")
      .select("id")
      .or(
        `and(family1_id.eq.${family1Id},family2_id.eq.${family2Id}),and(family1_id.eq.${family2Id},family2_id.eq.${family1Id})`,
      )
      .single()

    if (existingMatch) {
      const { error } = await supabase.from("matches").update({ status: "declined" }).eq("id", existingMatch.id)

      if (error) {
        return { error: error.message }
      }
    } else {
      const { error } = await supabase.from("matches").insert({
        family1_id: family1Id.toString(),
        family2_id: family2Id.toString(),
        travel_plan1_id: travelPlan1Id.toString(),
        travel_plan2_id: travelPlan2Id.toString(),
        status: "declined",
        match_score: 0,
      })

      if (error) {
        return { error: error.message }
      }
    }

    revalidatePath("/matches")
    return { success: "Match declined" }
  } catch (error) {
    console.error("Decline match error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function sendMessage(formData: FormData) {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be logged in to send messages" }
  }

  const matchId = formData.get("match_id")
  const senderFamilyId = formData.get("sender_family_id")
  const content = formData.get("content")

  if (!matchId || !senderFamilyId || !content) {
    return { error: "Missing required message information" }
  }

  const messageContent = content.toString().trim()
  if (messageContent.length === 0) {
    return { error: "Message cannot be empty" }
  }

  try {
    const { data: match } = await supabase
      .from("matches")
      .select("family1_id, family2_id")
      .eq("id", matchId.toString())
      .single()

    if (!match) {
      return { error: "Match not found" }
    }

    const { data: family } = await supabase
      .from("families")
      .select("id")
      .eq("user_id", user.id)
      .eq("id", senderFamilyId.toString())
      .single()

    if (!family) {
      return { error: "Unauthorized to send message" }
    }

    if (match.family1_id !== family.id && match.family2_id !== family.id) {
      return { error: "You are not part of this conversation" }
    }

    const { error } = await supabase.from("messages").insert({
      match_id: matchId.toString(),
      sender_family_id: senderFamilyId.toString(),
      content: messageContent,
    })

    if (error) {
      return { error: error.message }
    }

    revalidatePath(`/messages/${matchId}`)
    return { success: "Message sent successfully" }
  } catch (error) {
    console.error("Send message error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function generateRecommendationsForFamily(familyId: string) {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const { data: travelPlans, error: plansError } = await supabase
      .from("travel_plans")
      .select("*")
      .eq("family_id", familyId)
      .eq("is_active", true)
      .order("start_date", { ascending: true })

    if (plansError) {
      console.error("Error fetching travel plans:", plansError)
      return { success: false, error: plansError.message }
    }

    if (!travelPlans || travelPlans.length === 0) {
      return { success: false, error: "No active travel plans found" }
    }

    const { data: family, error: familyError } = await supabase
      .from("families")
      .select("interests, children")
      .eq("id", familyId)
      .single()

    if (familyError) {
      console.error("Error fetching family details:", familyError)
      return { success: false, error: familyError.message }
    }

    for (const plan of travelPlans) {
      await generatePlaceRecommendations(familyId, plan.id, plan.destination, plan.latitude || 0, plan.longitude || 0)
    }

    return { success: true }
  } catch (error) {
    console.error("Error generating recommendations:", error)
    return { success: false, error: "Failed to generate recommendations" }
  }
}
