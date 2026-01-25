// app/worldview/page.tsx
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import WorldMap from "./world-map"
import Heartbeat from "@/components/heartbeat"
import IconPageShell from "@/components/icon-page-shell"

export const dynamic = "force-dynamic"

export default async function WorldviewPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, location_lat, location_lng")
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/setup-profile")
  if (profile && (profile.location_lat == null || profile.location_lng == null)) {
    redirect("/setup-profile?reason=location")
  }

  return (
    <IconPageShell contentClassName="flex flex-col">
      <div className="max-w-7xl mx-auto p-4 w-full">
        <h1 className="text-2xl font-semibold mb-3">Worldview</h1>
        <p className="text-sm text-gray-600 mb-4">
          Search a city, zoom the map, and see families there.
        </p>
        <Heartbeat />
        <WorldMap />
      </div>
    </IconPageShell>
  )
}
