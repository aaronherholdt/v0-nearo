import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import AppLeftNav from "@/components/app-left-nav"
import SimpleDashboard from "@/components/simple-dashboard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import SimpleProfileForm from "@/components/simple-profile-form"
import AdvancedProfileForm from "@/components/advanced-profile-form"

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/login")
  }

  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/setup-profile")
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <div className="hidden lg:block">
          <AppLeftNav />
        </div>
        <div className="space-y-6">
          <Tabs defaultValue="main" className="w-full space-y-6">
            <TabsList className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3">
              <TabsTrigger value="main" className="cursor-pointer">Main Account</TabsTrigger>
              <TabsTrigger value="basic" className="cursor-pointer">Basic Profile</TabsTrigger>
              <TabsTrigger value="advanced" className="cursor-pointer">Advanced Profile</TabsTrigger>
            </TabsList>

            <TabsContent value="main" className="mt-6">
              <SimpleDashboard user={user} profile={profile} />
            </TabsContent>

            <TabsContent value="basic" className="mt-6">
              <SimpleProfileForm existingProfile={profile} />
            </TabsContent>

            <TabsContent value="advanced" className="mt-6">
              <AdvancedProfileForm existingProfile={profile} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
