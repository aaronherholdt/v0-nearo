import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import LoginForm from "@/components/login-form"
import { Suspense } from "react"

function LoginPageContent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <LoginForm />
    </div>
  )
}

export default async function LoginPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (session) redirect("/dashboard"); // <-- same destination as above

  return <LoginPageContent />
}
