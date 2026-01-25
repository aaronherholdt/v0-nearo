"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Edit, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { deriveAgeFromChild, formatChildSummary } from "@/lib/childrenUtils"

interface SimpleProfileProps {
  user: any
  profile: any
}

export default function SimpleDashboard({ user, profile }: SimpleProfileProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [available, setAvailable] = useState<boolean>(!!profile?.available_to_meet)
  const supabase = createClientComponentClient()

  // Get unread message count
  useEffect(() => {
    async function getUnreadCount() {
      if (!user?.id) return

      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("is_read", false)

      setUnreadCount(count || 0)
    }

    getUnreadCount()

    // Set up subscription for new messages
    const channel = supabase
      .channel("messages-changes")
      .on("postgres_changes", 
        { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${user.id}` },
        () => {
          getUnreadCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, supabase])

  async function toggleAvailable() {
    const next = !available
    setAvailable(next)
    await supabase.from("profiles").update({ available_to_meet: next }).eq("id", user.id)
  }

  function formatKids(children: any, kidsAges?: string) {
    // First try to use the children JSON array if available
    if (Array.isArray(children) && children.length > 0) {
      const kidDetails = children
        .map((c: any) => formatChildSummary(c))
        .filter((entry): entry is string => Boolean(entry));
      
      // Return formatted string if we have details
      if (kidDetails.length > 0) {
        return `Kids: ${kidDetails.join(", ")}`;
      }
      return children.length === 1 ? "1 kid" : `${children.length} kids`;
    }
    
    // Fall back to the kidsAges string if children array isn't available
    if (kidsAges) {
      return `Kids: ${kidsAges}`;
    }
    
    return "Kids: Not specified";
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg p-6 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Welcome, {profile?.family_name || "Family"}!</h1>
            <p className="text-emerald-100">
              Connect with other families locally or on your travels.
            </p>
          </div>
          <Link href="/setup-profile">
            <Button variant="secondary" size="sm" className="cursor-pointer">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* Location & availability integrated into profile card below */}

      {/* Profile Summary */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your Family Profile</CardTitle>
            <div className="flex items-center gap-3">
              <button onClick={toggleAvailable} className={`px-3 py-1 rounded-md text-sm border cursor-pointer hover:shadow-sm transition-all duration-200 ${available?"bg-emerald-50 border-emerald-400 text-emerald-700 hover:bg-emerald-100":"bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400"}`}>
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className={`h-4 w-4 ${available?"text-emerald-600":"text-gray-400"}`} />
                  {available?"Available to meet":"Mark available"}
                </span>
              </button>
              <Link href="/setup-profile"><Button variant="outline" size="sm" className="cursor-pointer">Edit</Button></Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Profile photo */}
            {profile?.family_photo_url && (
              <div className="flex justify-center">
                <img
                  src={profile.family_photo_url}
                  alt={`${profile?.family_name || 'Family'} photo`}
                  className="h-24 w-24 rounded-full object-cover border-2 border-emerald-100"
                />
              </div>
            )}
            <div>
              <h3 className="font-medium">{profile?.family_name}</h3>
              <p className="text-gray-600">{formatKids(profile?.children, profile?.kids_ages)}</p>
              {profile?.homeschool_style && (
                <p className="text-gray-600 mt-1">Homeschool style: {profile?.homeschool_style}</p>
              )}
            </div>
            {profile?.bio && (
              <div className="text-gray-700 text-sm border-t pt-3 mt-3">
                <p>{profile?.bio}</p>
              </div>
            )}

            {profile?.current_location && (
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-emerald-500 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium">Currently in {profile.current_location}</p>
                  {profile.current_until && (
                    <p className="text-gray-600">Until {new Date(profile.current_until).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            )}

            {profile?.future_location && (
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium">Planning to visit {profile.future_location}</p>
                  {profile.future_from && profile.future_until && (
                    <p className="text-gray-600">
                      From {new Date(profile.future_from).toLocaleDateString()} to {new Date(profile.future_until).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  )
}


