"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Edit, CheckCircle2 } from "lucide-react"
import Link from "next/link"

// add near top of file, below imports
const normalizeCity = (s?: string | null) =>
  s
    ? s.split(",")[0]
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
    : ""

// Helper function for age match scoring
function calculateAgeMatchScore(userAges: number[], otherAges: number[]) {
  if (!userAges.length || !otherAges.length) return 0
  let minGap = Infinity
  for (const a of userAges) for (const b of otherAges) minGap = Math.min(minGap, Math.abs(a-b))
  if (minGap === 0) return 100
  if (minGap <= 1) return 90
  if (minGap <= 2) return 80
  if (minGap <= 3) return 70
  if (minGap <= 5) return 50
  return Math.max(0, 40 - (minGap - 5) * 4)
}

interface SimpleProfileProps {
  user: any
  profile: any
}

export default function SimpleDashboard({ user, profile }: SimpleProfileProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [available, setAvailable] = useState<boolean>(!!profile?.available_to_meet)
  const [nearby, setNearby] = useState<any[]>([])
  const [messagesPreview, setMessagesPreview] = useState<any[]>([])
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

  // Load nearby families (same city, optional date overlap heuristic)
  useEffect(() => {
    async function loadNearby() {
      if (!profile?.standard_city && !profile?.current_location && !profile?.location_full_name) return

      const cityKey = normalizeCity(
        profile.standard_city || profile.location_full_name || profile.current_location
      )

      if (!cityKey) return

      const { data, error } = await supabase.rpc('profiles_nearby', {
        p_city: cityKey,
        p_exclude: user.id
      })
      if (error) console.error('profiles_nearby error', error)

      // Calculate age match scores
      const userAges = Array.isArray(profile?.children)
        ? profile.children.map((c:any)=>Number(c?.age||0)).filter(Boolean) : []

      const enriched = (data||[]).map(f => {
        const ages = Array.isArray(f.children) ? f.children.map((c:any)=>Number(c?.age||0)).filter(Boolean) : []
        return { ...f, match_score: calculateAgeMatchScore(userAges, ages) }
      })

      setNearby(enriched || [])
    }
    loadNearby()
  }, [profile?.standard_city, profile?.current_location, profile?.location_full_name, user?.id, supabase])

  // Load last 5 conversations
  useEffect(() => {
    async function loadMessagesPreview() {
      const { data: sent } = await supabase
        .from("messages").select("receiver_id, created_at, content").eq("sender_id", user.id).order("created_at", { ascending: false })
      const { data: received } = await supabase
        .from("messages").select("sender_id, created_at, content").eq("receiver_id", user.id).order("created_at", { ascending: false })
      const ids = new Set<string>()
      const merged = [...(sent||[]).map(m=>({ otherId: m.receiver_id, created_at: m.created_at, content: m.content })), ...(received||[]).map(m=>({ otherId: (m as any).sender_id, created_at: m.created_at, content: m.content }))]
        .sort((a,b)=> new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .filter(m=>{ if(ids.has(m.otherId)) return false; ids.add(m.otherId); return true })
        .slice(0,5)
      if (merged.length === 0) { setMessagesPreview([]); return }
      const { data: profiles } = await supabase.from("profiles").select("id, family_name").in("id", merged.map(m=>m.otherId))
      const withNames = merged.map(m=> ({ ...m, family_name: profiles?.find(p=>p.id===m.otherId)?.family_name || "Family" }))
      setMessagesPreview(withNames)
    }
    loadMessagesPreview()
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
        .map((c: any) => {
          // Extract age and gender, ensuring they are properly formatted
          const age = c.age !== null && c.age !== undefined ? String(c.age) : undefined;
          const gender = c.gender ? c.gender.charAt(0).toUpperCase() + c.gender.slice(1) : undefined;
          
          // Format the display string based on available data
          if (age && gender) {
            return `${gender} ${age}`;
          } else if (age) {
            return `Age ${age}`;
          } else if (gender) {
            return gender;
          }
          return c.name || undefined;
        })
        .filter(Boolean);
      
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
              <button onClick={toggleAvailable} className={`px-3 py-1 rounded-md text-sm border ${available?"bg-emerald-50 border-emerald-400 text-emerald-700":"bg-white border-gray-300"}`}>
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

      {/* Nearby Families */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Nearby Families</CardTitle>
        </CardHeader>
        <CardContent>
          {nearby.length === 0 ? (
            <div className="text-gray-600 text-sm">No families in your city yet.</div>
          ) : (
            <div className="space-y-3">
              {nearby.map((f: any) => (
                <div key={f.id} className="flex gap-4 p-3 border rounded-lg">
                  {/* Photo */}
                  <img
                    src={f.avatar_url || f.family_photo_url || "/placeholder-user.jpg"}
                    alt=""
                    className="h-14 w-14 rounded-full object-cover"
                  />

                  {/* Main */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{f.family_name}</div>
                      {f.available_to_meet && (
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                          Available
                        </span>
                      )}
                      {typeof f.match_score === 'number' && f.match_score >= 80 && (
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                          Strong age match
                        </span>
                      )}
                      {f.homeschool_style && (
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100">
                          {f.homeschool_style}
                        </span>
                      )}
                    </div>

                    {/* Kids summary */}
                    <div className="text-sm text-gray-600">
                      {formatKids(f.children, f.kids_ages)}
                    </div>

                    {/* Locations */}
                    {(() => {
                      const label = f.location_full_name || f.current_location || f.standard_city
                      return label && (
                        <div className="text-sm text-gray-700 mt-1">
                          <span className="font-medium">Now:</span> {label}
                          {f.current_until && ` (until ${new Date(f.current_until).toLocaleDateString()})`}
                        </div>
                      )
                    })()}
                    {f.future_location && (
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Next:</span> {f.future_location}
                        {f.future_from && f.future_until &&
                          ` (${new Date(f.future_from).toLocaleDateString()} – ${new Date(f.future_until).toLocaleDateString()})`}
                      </div>
                    )}

                    {/* Bio */}
                    {f.bio && (
                      <p className="text-sm text-gray-700 mt-2 line-clamp-3">{f.bio}</p>
                    )}

                    {/* Actions */}
                    <div className="mt-2 flex gap-2">
                      <Link href={`/families/${f.id}`}>
                        <Button variant="outline" size="sm" className="cursor-pointer">View profile</Button>
                      </Link>
                      <Link href={`/chat/${f.id}`}>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer">
                          Message
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Messages Preview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent>
          {messagesPreview.length === 0 ? (
            <div className="text-gray-600 text-sm">No conversations yet.</div>
          ) : (
            <div className="space-y-2">
              {messagesPreview.map(m => (
                <Link key={m.otherId} href={`/chat/${m.otherId}`} className="block">
                  <div className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="font-medium truncate pr-2">{m.family_name}</div>
                    <div className="text-sm text-gray-600 truncate max-w-[60%]">{m.content}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <div className="mt-3"><Link href="/chat"><Button variant="outline" size="sm" className="cursor-pointer">Open Chat</Button></Link></div>
        </CardContent>
      </Card>

      
    </div>
  )
}
