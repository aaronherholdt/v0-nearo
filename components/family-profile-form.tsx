"use client"

import type React from "react"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Users, Plus, Minus, Camera, Upload } from "lucide-react"
import { createFamilyProfile } from "@/lib/actions"

interface Child {
  name: string
  gender: string
  age: string
}

interface FamilyProfileFormProps {
  existingFamily?: any
}

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isEditing ? "Updating profile..." : "Creating profile..."}
        </>
      ) : (
        isEditing ? "Update Family Profile" : "Create Family Profile"
      )}
    </Button>
  )
}

export default function FamilyProfileForm({ existingFamily }: FamilyProfileFormProps) {
  const [state, formAction] = useActionState(createFamilyProfile, null)
  const [children, setChildren] = useState<Child[]>(
    existingFamily?.children?.length > 0
      ? existingFamily.children
      : [{ name: "", gender: "", age: "" }]
  )
  const [photoPreview, setPhotoPreview] = useState<string | null>(existingFamily?.family_photo_url || null)

  const addChild = () => {
    setChildren([...children, { name: "", gender: "", age: "" }])
  }

  const removeChild = (index: number) => {
    if (children.length > 1) {
      setChildren(children.filter((_, i) => i !== index))
    }
  }

  const updateChild = (index: number, field: keyof Child, value: string) => {
    const updatedChildren = children.map((child, i) => (i === index ? { ...child, [field]: value } : child))
    setChildren(updatedChildren)
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-emerald-600 mr-2" />
          </div>
          <CardTitle className="text-2xl">{existingFamily ? "Edit" : "Create"} Your Family Profile</CardTitle>
          <CardDescription>
            Tell other homeschooling families about your family so you can connect during your travels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-6">
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
                  <Input
                    id="familyPhoto"
                    name="familyPhoto"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("familyPhoto")?.click()}
                    className="text-emerald-600 border-emerald-600 hover:bg-emerald-50 cursor-pointer"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {photoPreview ? "Change Photo" : "Upload Photo"}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  Upload a family photo to help other families recognize you during meetups
                </p>
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
                defaultValue={existingFamily?.family_name || ""}
                required 
                className="w-full" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="fatherName" className="block text-sm font-medium text-gray-700">
                  Father's Name
                </label>
                <Input 
                  id="fatherName" 
                  name="fatherName" 
                  placeholder="John Smith" 
                  defaultValue={existingFamily?.father_name || ""}
                  className="w-full" 
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="motherName" className="block text-sm font-medium text-gray-700">
                  Mother's Name
                </label>
                <Input 
                  id="motherName" 
                  name="motherName" 
                  placeholder="Jane Smith" 
                  defaultValue={existingFamily?.mother_name || ""}
                  className="w-full" 
                />
              </div>
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

              <p className="text-xs text-gray-500">
                Add each child with their name, gender and age (e.g., Emma, Girl, 7)
              </p>
            </div>

            {/* Hidden input to pass children data to server action */}
            <input
              type="hidden"
              name="children"
              value={JSON.stringify(children.filter((child) => child.name && child.gender && child.age))}
            />

            <div className="space-y-2">
              <label htmlFor="homeschoolStyle" className="block text-sm font-medium text-gray-700">
                Homeschool Style
              </label>
              <Select name="homeschoolStyle" defaultValue={existingFamily?.homeschool_style || ""}>
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
              <label htmlFor="interests" className="block text-sm font-medium text-gray-700">
                Family Interests & Activities
              </label>
              <Input
                id="interests"
                name="interests"
                placeholder="Museums, hiking, science, art, music"
                defaultValue={existingFamily?.interests ? existingFamily.interests.join(", ") : ""}
                className="w-full"
              />
              <p className="text-xs text-gray-500">Enter interests separated by commas</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                Family Bio
              </label>
              <Textarea
                id="bio"
                name="bio"
                placeholder="Tell other families a bit about yourselves, your homeschool journey, and what you enjoy doing together..."
                defaultValue={existingFamily?.bio || ""}
                rows={4}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="homeLocation" className="block text-sm font-medium text-gray-700">
                Home Location
              </label>
              <Input
                id="homeLocation"
                name="homeLocation"
                placeholder="City, State/Province, Country"
                defaultValue={existingFamily?.home_location_name || ""}
                className="w-full"
              />
              <p className="text-xs text-gray-500">Enter your home base location (e.g., Austin, TX, USA)</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="radiusPreference" className="block text-sm font-medium text-gray-700">
                Match Radius Preference (miles)
              </label>
              <Input
                id="radiusPreference"
                name="radiusPreference"
                type="number"
                min="5"
                max="500"
                placeholder="50"
                defaultValue={existingFamily?.radius_preference || "50"}
                className="w-full"
              />
              <p className="text-xs text-gray-500">How far from your home location would you like to find matches?</p>
            </div>

            <SubmitButton isEditing={!!existingFamily} />
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
