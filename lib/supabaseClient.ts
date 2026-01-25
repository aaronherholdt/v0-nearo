"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { getPostAuthRedirectPath } from "@/lib/auth/redirects"

export async function signInWithGoogle() {
  const supabase = await createClient()

  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const next = "/dashboard" // Change to your real homepage if different
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${base}/auth/callback?next=${encodeURIComponent(next)}`,
      queryParams: { access_type: "offline", prompt: "consent" } // optional: refresh tokens
    }
  })

  if (error) {
    console.error("OAuth error", error)
    return
  }

  // The redirect will happen automatically via the OAuth flow
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

  const supabase = await createClient()

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.toString(),
      password: password.toString(),
    })

    if (error) {
      return { error: error.message }
    }

    const redirectTo = await getPostAuthRedirectPath(supabase)
    return { success: true, redirectTo }
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

  const supabase = await createClient()

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

    return { success: "Almost there! We've emailed a confirmation link. Don't see it? Check Spam/Promotions. If it's there, mark \"Not spam\" and move it to your Inbox so you don't miss matches or meetup updates. Add admin@nearo.forum to contacts." }
  } catch (error) {
    console.error("Sign up error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/auth/login")
}

export async function createFamilyProfile(prevState: any, formData: FormData) {
  // Temporarily disabled while legacy tables are removed
  return { error: "Family profiles via 'families' table are disabled in MVP" }
}

export async function createTravelPlan(prevState: any, formData: FormData) {
  // Temporarily disabled while legacy tables are removed
  return { error: "Travel plans are disabled in MVP" }
}

// recommendations disabled

export async function acceptMatch(formData: FormData) {
  // Temporarily disabled while legacy tables are removed
  return { error: "Matches are disabled in MVP" }
}

export async function declineMatch(formData: FormData) {
  // Temporarily disabled while legacy tables are removed
  return { error: "Matches are disabled in MVP" }
}

export async function sendMessage(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be logged in to send messages" }
  }
  const receiverId = formData.get("receiver_id")
  const content = formData.get("content")

  if (!receiverId || !content) {
    return { error: "Missing required message information" }
  }

  const messageContent = content.toString().trim()
  if (messageContent.length === 0) {
    return { error: "Message cannot be empty" }
  }

  try {
    const { error } = await supabase
      .from("messages")
      .insert({
        sender_id: user.id,
        receiver_id: receiverId.toString(),
        content: messageContent,
      })

    if (error) {
      return { error: error.message }
    }

    revalidatePath(`/chat/${receiverId}`)
    return { success: "Message sent successfully" }
  } catch (error) {
    console.error("Send message error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function updateTravelPlan(prevState: any, formData: FormData) {
  return { error: "Travel plans are disabled in MVP" }
}

export async function generateRecommendationsForFamily(familyId: string) {
  return { success: false, error: "Recommendations are disabled in MVP" }
}
