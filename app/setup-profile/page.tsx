import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import SimpleProfileForm from "@/components/simple-profile-form"
import AdvancedProfileForm from "@/components/advanced-profile-form"

export default async function SetupProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if profile already exists
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Set Up Your Profile</h1>
          <p className="text-gray-600">Complete your basic profile to get started. Advanced settings are optional.</p>
        </div>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic" className="cursor-pointer">Basic Profile</TabsTrigger>
            <TabsTrigger value="advanced" className="cursor-pointer">Advanced Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="mt-6">
            <SimpleProfileForm existingProfile={profile} />
          </TabsContent>

          <TabsContent value="advanced" className="mt-6">
            <AdvancedProfileForm existingProfile={profile} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}