"use client"

import { useState, useEffect, useRef } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Users, Plus, Minus, Camera, Upload } from "lucide-react"
import { getCurrentPosition, normalizeCity } from "@/lib/locationUtils"
import LocationInput, { PickedLocation } from "@/components/location-input"

type ProfileFormState = { 
  error?: string
  success?: string
}

interface SimpleProfileFormProps {
  existingProfile?: any
}

function SubmitButton({ isEditing, loading }: { isEditing: boolean; loading: boolean }) {
  return (
    <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isEditing ? "Updating profile..." : "Creating profile..."}
        </>
      ) : (
        isEditing ? "Update Profile" : "Create Profile"
      )}
    </Button>
  )
}

export default function SimpleProfileForm({ existingProfile }: SimpleProfileFormProps) {
  const supabase = createClientComponentClient()
  const [state, setState] = useState<ProfileFormState>({})
  const [saving, setSaving] = useState(false)
  const [children, setChildren] = useState<Array<{ name: string; gender: string; age: string }>>(
    Array.isArray(existingProfile?.children) && existingProfile.children.length > 0
      ? existingProfile.children.map((c: any) => ({
          name: (c?.name || "").toString(),
          gender: (c?.gender || "").toString(),
          age: c?.age != null ? String(c.age) : "",
        }))
      : existingProfile?.kids_ages
        ? existingProfile.kids_ages
            .toString()
            .split(",")
            .map((token: string) => token.trim())
            .filter((token: string) => token.length > 0)
            .map((token: string) => {
              const ageMatch = token.match(/\d+/)
              const genderMatch = token.match(/\b(boy|girl)\b/i)
              return {
                name: "",
                gender: genderMatch ? genderMatch[1].toLowerCase() : "",
                age: ageMatch ? ageMatch[0] : token,
              }
            })
        : [{ name: "", gender: "", age: "" }]
  )
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  // LocationInput state
  const initialLocation =
    existingProfile?.location_full_name ||
    [existingProfile?.standard_city, existingProfile?.standard_country].filter(Boolean).join(", ")
  const [locationText, setLocationText] = useState(initialLocation || "")
  const [pickedLocation, setPickedLocation] = useState<PickedLocation | null>(null)
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null)

  // Legacy location state (keeping current_location for backward compatibility)
  const [currentLocation, setCurrentLocation] = useState(existingProfile?.current_location || "")

  // Get user's current location when component mounts
  useEffect(() => {
    getUserLocation()
  }, [])
  
  // Get user's current location
  const getUserLocation = async () => {
    try {
      const position = await getCurrentPosition()
      setUserLocation(position)
    } catch (error) {
      console.error("Error getting user location:", error)
    }
  }
  

  


  const addChild = () => {
    setChildren([...children, { name: "", gender: "", age: "" }])
  }

  const removeChild = (index: number) => {
    if (children.length > 1) {
      setChildren(children.filter((_, i) => i !== index))
    }
  }

  const updateChild = (index: number, field: "name" | "gender" | "age", value: string) => {
    const updated = children.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    setChildren(updated)
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => setPhotoPreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    }
  }
  
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState({})
    setSaving(true)

    try {
      const form = new FormData(e.currentTarget)
      const familyName = form.get("familyName")?.toString().trim()
      const kidsAges = form.get("kidsAges")?.toString().trim() || ""
      // Use the state value for currentLocation instead of form value
      // to ensure we get the exact value from the selected suggestion
      const locationValue = currentLocation.trim() || null
      const homeschoolStyle = form.get("homeschoolStyle")?.toString() || null
      const bio = form.get("bio")?.toString() || null

      if (!familyName || kidsAges.length === 0) {
        setState({ error: "Family name and kids' ages are required" })
        setSaving(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setState({ error: "Please sign in." })
        setSaving(false)
        return
      }
      
      // 1) Children -> JSON for DB
      const childrenJson = children.map((c) => ({
        name: (c.name || "").trim(),
        gender: c.gender || null,  // "boy" | "girl" | null
        age: c.age ? Number(c.age) : null,
      })).filter(c => c.name || c.age || c.gender);

      // 2) Optional photo upload to Supabase Storage (public bucket: family-photos)
      let familyPhotoUrl: string | null = existingProfile?.family_photo_url || null
      const fileInput = (document.getElementById("simpleFamilyPhoto") as HTMLInputElement) || null
      const file = fileInput?.files?.[0] || null

      if (file) {
        const path = `${user.id}/${Date.now()}-${file.name}`
        const { error: upErr } = await supabase.storage.from("family-photos").upload(path, file, { upsert: true })
        if (upErr) throw new Error(`Photo upload failed: ${upErr.message}`)
        const { data: pub } = supabase.storage.from("family-photos").getPublicUrl(path)
        familyPhotoUrl = pub.publicUrl
      }

      // Handle location data from LocationInput
      const typedCity = normalizeCity(locationText)
      const locationUpdate = {
        location_full_name: pickedLocation?.fullName ?? (locationText || null),
        standard_city: pickedLocation ? normalizeCity(pickedLocation.city) : (typedCity || null),
        standard_country: pickedLocation?.country ? normalizeCity(pickedLocation.country) : (existingProfile?.standard_country ?? null),
        location_lat: pickedLocation?.latitude ?? null,
        location_lng: pickedLocation?.longitude ?? null,
        // Keep current_location for backward compatibility
        current_location: locationText || null,
      }

      const { error } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          family_name: familyName,
          homeschool_style: homeschoolStyle,
          bio,
          children: childrenJson,
          family_photo_url: familyPhotoUrl,   // null if no photo chosen
          updated_at: new Date().toISOString(),
          ...locationUpdate,
        },
        { onConflict: "id" }
      )

      if (error) {
        setState({ error: `Database error: ${error.message}` })
        setSaving(false)
        return
      }

      setState({ success: existingProfile ? "Profile updated" : "Profile created" })
      window.location.href = "/dashboard"
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred. Please try again."
      setState({ error: message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-emerald-600 mr-2" />
          </div>
          <CardTitle className="text-2xl">{existingProfile ? "Edit" : "Create"} Your Profile</CardTitle>
          <CardDescription>
            Share basic information to connect with other families during your travels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {state?.error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {state.error}
              </div>
            )}

            {state?.success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                {state.success}
              </div>
            )}

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">Family Photo</label>
              <div className="flex flex-col items-center space-y-4">
                {photoPreview ? (
                  <div className="relative">
                    <img
                      src={photoPreview || "/placeholder.svg"}
                      alt="Family photo preview"
                      className="w-32 h-32 object-cover rounded-full border-4 border-emerald-100"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center bg-gray-50">
                    <Camera className="h-8 w-8 text-gray-400" />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Input id="simpleFamilyPhoto" name="simpleFamilyPhoto" type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("simpleFamilyPhoto")?.click()}
                    className="text-emerald-600 border-emerald-600 hover:bg-emerald-50 cursor-pointer"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {photoPreview ? "Change Photo" : "Upload Photo"}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 text-center">Optional: add a family photo for recognition during meetups</p>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="familyName" className="block text-sm font-medium text-gray-700">
                Family Name *
              </label>
              <Input 
                id="familyName" 
                name="familyName" 
                placeholder="The Smith Family" 
                defaultValue={existingProfile?.family_name || ""}
                required 
                className="w-full" 
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Children *</label>
                <Button
                  type="button"
                  onClick={addChild}
                  variant="outline"
                  size="sm"
                  className="text-emerald-600 border-emerald-600 hover:bg-emerald-50 bg-transparent cursor-pointer"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Child
                </Button>
              </div>

              {children.map((child, index) => (
                <div key={index} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Input
                      name={`child-${index}-name`}
                      placeholder="Child's name"
                      value={child.name}
                      onChange={(e) => updateChild(index, "name", e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div className="flex-1">
                    <Select
                      name={`child-${index}-gender`}
                      value={child.gender}
                      onValueChange={(value) => updateChild(index, "gender", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="boy">Boy</SelectItem>
                        <SelectItem value="girl">Girl</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1">
                    <Input
                      name={`child-${index}-age`}
                      type="number"
                      min="0"
                      max="18"
                      placeholder="Age"
                      value={child.age}
                      onChange={(e) => updateChild(index, "age", e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {children.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeChild(index)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              <p className="text-xs text-gray-500">Add each child with their name, gender and age</p>
            </div>

            {/* Hidden input to pass derived kidsAges string to server action */}
            <input
              type="hidden"
              name="kidsAges"
              value={children
                .map((c) => {
                  const age = (c.age || "").toString().trim()
                  const gender = (c.gender || "").toString().trim()
                  if (!age) return ""
                  if (gender) return `${gender.charAt(0).toUpperCase()}${gender.slice(1)} ${age}`
                  return age
                })
                .filter((entry) => entry.length > 0)
                .join(", ")}
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Current Location
              </label>
              <LocationInput
                value={locationText}
                onValueChange={setLocationText}
                onPick={setPickedLocation}
                userPosition={userLocation}
                placeholder="Type a city/town/village (e.g., Istanbul, Turkey)"
              />
              <p className="text-xs text-gray-500">
                Tip: Select a suggestion, but if you just type the city and submit, we'll still match it.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="homeschoolStyle" className="block text-sm font-medium text-gray-700">
                Homeschool Style
              </label>
              <Select name="homeschoolStyle" defaultValue={existingProfile?.homeschool_style || ""}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your homeschool approach" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="traditional">Traditional/Structured</SelectItem>
                  <SelectItem value="charlotte-mason">Charlotte Mason</SelectItem>
                  <SelectItem value="montessori">Montessori</SelectItem>
                  <SelectItem value="waldorf">Waldorf/Steiner</SelectItem>
                  <SelectItem value="unschooling">Unschooling</SelectItem>
                  <SelectItem value="unit-studies">Unit Studies</SelectItem>
                  <SelectItem value="eclectic">Eclectic</SelectItem>
                  <SelectItem value="online">Online/Virtual</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                Family Bio
              </label>
              <Textarea
                id="bio"
                name="bio"
                placeholder="Tell other families a bit about yourselves, your homeschool journey, and what you enjoy doing together..."
                defaultValue={existingProfile?.bio || ""}
                rows={4}
                className="w-full"
              />
            </div>

            

            <SubmitButton isEditing={!!existingProfile} loading={saving} />
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
