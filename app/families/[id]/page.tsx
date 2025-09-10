import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, MessageCircle, Edit, CheckCircle2, Users } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

interface FamilyProfile {
  id: string
  family_name: string
  bio?: string
  kids_ages?: string
  children?: Array<{ name?: string; gender?: string; age?: number | string | null }>
  current_location: string | null
  standard_city?: string | null
  standard_country?: string | null
  current_until: string | null
  future_location: string | null
  future_from: string | null
  future_until: string | null
  family_photo_url?: string
  avatar_url?: string
  homeschool_style?: string
  available_to_meet?: boolean
}

export default async function FamilyProfilePage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if current user has a profile
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!userProfile) {
    redirect("/setup-profile")
  }

  // Get the family profile
  const { data: familyProfile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", params.id)
    .single()

  if (error || !familyProfile) {
    notFound()
  }

  const profile = familyProfile as FamilyProfile

  // Helper function for kids formatting
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
        return kidDetails.join(", ");
      }
      return children.length === 1 ? "1 kid" : `${children.length} kids`;
    }

    // Fall back to the kidsAges string if children array isn't available
    if (kidsAges) {
      return kidsAges;
    }

    return "Not specified";
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/families" className="text-emerald-600 hover:text-emerald-700 mb-4 inline-block">
          ← Back to Families
        </Link>
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage
              src={profile.family_photo_url || profile.avatar_url}
              alt={`${profile.family_name} photo`}
            />
            <AvatarFallback className="text-xl">
              {profile.family_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{profile.family_name}</h1>
              {profile.available_to_meet && (
                <span className="px-3 py-1 rounded-md text-sm bg-emerald-50 border border-emerald-400 text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Available to meet
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-gray-600">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{formatKids(profile.children, profile.kids_ages)}</span>
              </div>
              {profile.homeschool_style && (
                <span>Homeschool style: {profile.homeschool_style}</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/chat/${profile.id}`}>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <MessageCircle className="h-4 w-4 mr-2" />
                Message
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Profile Card */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>About the Family</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Bio */}
              {profile.bio && (
                <div>
                  <h3 className="font-medium mb-2">About Us</h3>
                  <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
                </div>
              )}

              {/* Children Details */}
              <div>
                <h3 className="font-medium mb-3">Children</h3>
                {Array.isArray(profile.children) && profile.children.length > 0 ? (
                  <div className="space-y-2">
                    {profile.children.map((child, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-sm font-medium text-emerald-700">
                          {child.age || "?"}
                        </div>
                        <div>
                          <p className="font-medium">
                            {child.name || `Child ${index + 1}`}
                            {child.gender && (
                              <span className="text-gray-600 ml-2">
                                ({child.gender.charAt(0).toUpperCase() + child.gender.slice(1)})
                              </span>
                            )}
                          </p>
                          {child.age && (
                            <p className="text-sm text-gray-600">Age {child.age}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">
                    {profile.kids_ages || "Children details not specified"}
                  </p>
                )}
              </div>

              {/* Homeschool Style */}
              {profile.homeschool_style && (
                <div>
                  <h3 className="font-medium mb-2">Homeschool Style</h3>
                  <p className="text-gray-700">{profile.homeschool_style}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Location */}
          {profile.current_location && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{profile.current_location}</p>
                    {profile.current_until && (
                      <p className="text-sm text-gray-600">
                        Until {new Date(profile.current_until).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Future Plans */}
          {profile.future_location && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Travel Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{profile.future_location}</p>
                    {profile.future_from && profile.future_until && (
                      <p className="text-sm text-gray-600">
                        {new Date(profile.future_from).toLocaleDateString()} - {new Date(profile.future_until).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <Link href={`/chat/${profile.id}`} className="block">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </Link>
                <Link href="/families" className="block">
                  <Button variant="outline" className="w-full">
                    View All Families
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
