// app/auth/login/page.tsx
export const metadata = {
  robots: { index: false, follow: false },
  title: 'Log in · Nearo',
  description: 'Log in to Nearo to plan trips, meetups, and connect with traveling families.',
  // optional: set a self-canonical to avoid inherited values
  alternates: { canonical: '/auth/login' },
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "@/components/login-form"
import { getPostAuthRedirectPath } from "@/lib/auth/redirects"

function LoginPageContent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <LoginForm />
    </div>
  )
}

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    const destination = await getPostAuthRedirectPath(supabase)
    redirect(destination)
  }

  return <LoginPageContent />
}
