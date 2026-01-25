import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import SignUpForm from "@/components/sign-up-form"
import { getPostAuthRedirectPath } from "@/lib/auth/redirects"

// app/auth/sign-up/page.tsx
export const metadata = {
  robots: { index: false, follow: false },
  title: 'Create your Nearo account',
  description: 'Sign up for Nearo to meet like-minded traveling families and plan kid-friendly trips.',
  alternates: { canonical: '/auth/sign-up' },
}

export default async function SignUpPage() {
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <h1 className="text-2xl font-bold mb-4">Connect Supabase to get started</h1>
      </div>
    )
  }

  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    const destination = await getPostAuthRedirectPath(supabase)
    redirect(destination)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <SignUpForm />
    </div>
  )
}
