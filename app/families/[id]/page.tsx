import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, MessageCircle, Edit, CheckCircle2, Users } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { formatChildSummary } from "@/lib/childrenUtils"

interface FamilyProfile {
  id: string
  family_name: string
  bio?: string
  kids_ages?: string
  children?: Array<{ name?: string; gender?: string; age?: number | string | null; birthdate?: string | null; birth_year?: number | null }>
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
  match_prefs?: any
}

export default async function FamilyProfilePage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

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
    .select("*, match_prefs")
    .eq("id", params.id)
    .single()

  if (error || !familyProfile) {
    notFound()
  }

  const profile = familyProfile as FamilyProfile

  // Determine back link based on referer
  const headersList = headers()
  const referer = headersList.get('referer') || ''
  const cameFromFamilies = referer.includes('/families') && !referer.includes('/families/')
  const cameFromWorldview = referer.includes('/worldview')
  const backHref = cameFromFamilies ? '/families' : '/worldview'
  const backText = cameFromFamilies ? 'Back to Families' : 'Back to Worldview'

  // Helper function for kids formatting
  function formatKids(children: any, kidsAges?: string) {
    // First try to use the children JSON array if available
    if (Array.isArray(children) && children.length > 0) {
      const kidDetails = children
        .map((c: any) => formatChildSummary(c))
        .filter((entry): entry is string => Boolean(entry));

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
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-28 md:py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href={backHref} className="text-emerald-600 hover:text-emerald-700 mb-4 inline-block">
          ← {backText}
        </Link>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
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
          <div className="hidden md:flex gap-2">
            <Link href={`/chat/${profile.id}`}>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <MessageCircle className="h-4 w-4 mr-2" />
                Message
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Current Location */}
      {profile.current_location && (
        <div className="mb-6 flex items-start gap-3">
          <MapPin className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-gray-900">{profile.current_location}</p>
            {profile.current_until && (
              <p className="text-sm text-gray-600">
                Until {new Date(profile.current_until).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-1">
        {/* Main Profile Card */}
        <div className="md:col-span-1">
          <Card>
            <CardContent>
              <Tabs defaultValue="about" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="about" className="cursor-pointer">About Family</TabsTrigger>
                  {profile.match_prefs && profile.match_prefs.visibility?.show_advanced !== false && (
                    <TabsTrigger value="advanced" className="cursor-pointer">Advanced Profile</TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="about" className="space-y-6 mt-6">
                  {/* Bio */}
                  {profile.bio && (
                    <div>
                      <h3 className="font-medium mb-2">About Us</h3>
                      <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
                    </div>
                  )}
                </TabsContent>

                {profile.match_prefs && profile.match_prefs.visibility?.show_advanced !== false && (
                  <TabsContent value="advanced" className="space-y-6 mt-6">
                    {/* Interests */}
                    {profile.match_prefs.interests && profile.match_prefs.interests.length > 0 && (
                      <div>
                        <h3 className="font-medium mb-3 text-gray-700">Interests</h3>
                        <div className="flex flex-wrap gap-2">
                          {profile.match_prefs.interests.map((interest: string) => (
                            <span key={interest} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Looking for */}
                    {profile.match_prefs.looking_for && profile.match_prefs.looking_for.length > 0 && (
                      <div>
                        <h3 className="font-medium mb-3 text-gray-700">Looking for</h3>
                        <div className="flex flex-wrap gap-2">
                          {profile.match_prefs.looking_for.map((item: string) => (
                            <span key={item} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700 border border-blue-200">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Languages */}
                    {profile.match_prefs.languages && profile.match_prefs.languages.length > 0 && (
                      <div>
                        <h3 className="font-medium mb-3 text-gray-700">Languages</h3>
                        <div className="flex flex-wrap gap-2">
                          {profile.match_prefs.languages.map((language: string) => (
                            <span key={language} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-50 text-purple-700 border border-purple-200">
                              {language}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Inclusion */}
                    {profile.match_prefs.inclusion_tags && profile.match_prefs.inclusion_tags.length > 0 && (
                      <div>
                        <h3 className="font-medium mb-3 text-gray-700">Inclusion & Accessibility</h3>
                        <div className="flex flex-wrap gap-2">
                          {profile.match_prefs.inclusion_tags.map((tag: string) => (
                            <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-50 text-orange-700 border border-orange-200">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Travel */}
                    {(profile.match_prefs.travel?.modes || profile.match_prefs.travel?.max_km || profile.match_prefs.travel?.max_minutes) && (
                      <div>
                        <h3 className="font-medium mb-3 text-gray-700">Travel Preferences</h3>
                        <div className="space-y-3">
                          {profile.match_prefs.travel?.modes && profile.match_prefs.travel.modes.length > 0 && (
                            <div>
                              <p className="text-sm text-gray-600 mb-2">Preferred travel modes:</p>
                              <div className="flex flex-wrap gap-2">
                                {profile.match_prefs.travel.modes.map((mode: string) => (
                                  <span key={mode} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-50 text-gray-700 border border-gray-200">
                                    {mode}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {profile.match_prefs.travel?.max_km && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-gray-500" />
                                <span className="text-sm">Max distance: {profile.match_prefs.travel.max_km} km</span>
                              </div>
                            )}
                            {profile.match_prefs.travel?.max_minutes && (
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-gray-500" />
                                <span className="text-sm">Max travel time: {profile.match_prefs.travel.max_minutes} minutes</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        </div>


      </div>

      {/* Sidebar */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
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

        </div>
      </div>

      {/* Mobile sticky action */}
      <div className="fixed bottom-4 left-4 right-4 md:hidden z-50">
        <Link href={`/chat/${profile.id}`}>
          <Button className="w-full h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-lg">
            <MessageCircle className="h-5 w-5 mr-2" />
            Message
          </Button>
        </Link>
      </div>
    </div>
  )
}
