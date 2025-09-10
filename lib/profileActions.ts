"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function createSimpleProfile(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be logged in to create a profile" }
  }

  const familyName = formData.get("familyName")
  const kidsAges = formData.get("kidsAges")
  const currentLocation = formData.get("currentLocation")
  const currentUntil = formData.get("currentUntil")
  const futureLocation = formData.get("futureLocation")
  const futureFrom = formData.get("futureFrom")
  const futureUntil = formData.get("futureUntil")
  const homeschoolStyle = formData.get("homeschoolStyle")
  const bio = formData.get("bio")

  if (!familyName) {
    return { error: "Family name is required" }
  }

  try {
    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single()

    if (existingProfile) {
      // Update existing profile
      const { error } = await supabase
        .from("profiles")
        .update({
          family_name: familyName.toString(),
          current_location: currentLocation?.toString() || null,
          current_until: currentUntil?.toString() || null,
          future_location: futureLocation?.toString() || null,
          future_from: futureFrom?.toString() || null,
          future_until: futureUntil?.toString() || null,
          homeschool_style: homeschoolStyle?.toString() || null,
          bio: bio?.toString() || null,
        })
        .eq("id", existingProfile.id)

      if (error) {
        return { error: `Database error: ${error.message}` }
      }
    } else {
      // Create new profile
      const { error } = await supabase.from("profiles").insert({
        id: user.id,
        family_name: familyName.toString(),
        current_location: currentLocation?.toString() || null,
        current_until: currentUntil?.toString() || null,
        future_location: futureLocation?.toString() || null,
        future_from: futureFrom?.toString() || null,
        future_until: futureUntil?.toString() || null,
        homeschool_style: homeschoolStyle?.toString() || null,
        bio: bio?.toString() || null,
      })

      if (error) {
        if (error.message.includes("relation") && error.message.includes("does not exist")) {
          return { error: "Database tables not found. Please run the migration scripts to set up the database." }
        }
        return { error: `Database error: ${error.message}` }
      }
    }

    revalidatePath("/dashboard")
    // Redirect to dashboard/home after successful create/update
    redirect("/dashboard")
  } catch (error) {
    console.error("Create profile error:", error)
    if (error instanceof Error) {
      return { error: `Profile creation failed: ${error.message}` }
    }
    return { error: "An unexpected error occurred. Please try again." }
  }
}