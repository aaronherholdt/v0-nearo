"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, Calendar, Users, Heart, Eye } from "lucide-react"
import { format } from "date-fns"
import { acceptMatch } from "@/lib/supabaseClient"
import Link from "next/link"
import { deriveAgeFromChild } from "@/lib/childrenUtils"

interface FamilyTravelCardProps {
  travelPlan: {
    id: string
    title: string
    destination: string
    start_date: string
    end_date: string
    description?: string
  }
  family: {
    id: string
    family_name: string
    father_name: string
    mother_name: string
    children: Array<{ name: string; gender: string; age?: string | number; birthdate?: string | null; birth_year?: number | null }>
    interests?: string[]
    bio?: string
    homeschool_style?: string
    family_photo_url?: string
  } | null
  currentFamilyId: string
}

export default function FamilyTravelCard({ travelPlan, family, currentFamilyId }: FamilyTravelCardProps) {
  if (!family) return null

  const parentNames = [family.father_name, family.mother_name].filter(Boolean).join(" & ")
  const childAges = (family.children || [])
    .map((child) => {
      const derived = deriveAgeFromChild(child)
      if (derived !== null) return String(derived)
      if (typeof child.age === "number") return String(child.age)
      if (typeof child.age === "string" && child.age.trim().length > 0) return child.age.trim()
      return ""
    })
    .filter((age) => age.length > 0)

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-start space-x-3 flex-1">
            <Avatar className="h-12 w-12 border-2 border-emerald-100">
              {family.family_photo_url ? (
                <AvatarImage src={family.family_photo_url || "/placeholder.svg"} alt={`${family.family_name} photo`} />
              ) : null}
              <AvatarFallback className="bg-emerald-100 text-emerald-700 font-semibold">
                {family.family_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Link href={`/families/${family.id}`} className="hover:text-emerald-600 transition-colors">
                <CardTitle className="text-lg cursor-pointer">{family.family_name}</CardTitle>
              </Link>
              <CardDescription>{parentNames}</CardDescription>
            </div>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Users className="h-4 w-4 mr-1" />
            {family.children.length} kids
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Travel Plan */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <h4 className="font-medium text-blue-800 flex items-center mb-1">
            <MapPin className="h-4 w-4 mr-1" />
            {travelPlan.title}
          </h4>
          <p className="text-sm text-blue-700">{travelPlan.destination}</p>
          <p className="text-xs text-blue-600 flex items-center mt-1">
            <Calendar className="h-3 w-3 mr-1" />
            {format(new Date(travelPlan.start_date), "MMM d")} - {format(new Date(travelPlan.end_date), "MMM d, yyyy")}
          </p>
        </div>

        {/* Family Details */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Kids ages:</span>
            <span className="font-medium">
              {childAges.length > 0 ? childAges.join(", ") : "Not specified"}
            </span>
          </div>

          {family.homeschool_style && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Style:</span>
              <Badge variant="outline" className="text-xs">
                {family.homeschool_style}
              </Badge>
            </div>
          )}
        </div>

        {/* Interests */}
        {family.interests && family.interests.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Interests:</p>
            <div className="flex flex-wrap gap-1">
              {family.interests.slice(0, 4).map((interest, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {interest}
                </Badge>
              ))}
              {family.interests.length > 4 && (
                <Badge variant="secondary" className="text-xs">
                  +{family.interests.length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Bio */}
        {family.bio && <p className="text-sm text-gray-600 line-clamp-2">{family.bio}</p>}

        {/* Travel Plan Description */}
        {travelPlan.description && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Travel Plans:</p>
            <p className="text-sm text-gray-600 line-clamp-2">{travelPlan.description}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <Link href={`/families/${family.id}`} className="flex-1">
            <Button variant="outline" className="w-full bg-transparent">
              <Eye className="h-4 w-4 mr-2" />
              View Profile
            </Button>
          </Link>
          <form action={acceptMatch} className="flex-1">
            <input type="hidden" name="family1_id" value={currentFamilyId} />
            <input type="hidden" name="family2_id" value={family.id} />
            <input type="hidden" name="travel_plan1_id" value="" />
            <input type="hidden" name="travel_plan2_id" value={travelPlan.id} />
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
              <Heart className="h-4 w-4 mr-2" />
              Connect
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}
