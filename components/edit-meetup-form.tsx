"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import LocationInput from "@/components/location-input"
import { getCurrentPosition, normalizeCity } from "@/lib/locationUtils"

interface EditMeetupFormProps {
  thread: any
}

export default function EditMeetupForm({ thread }: EditMeetupFormProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  const [title, setTitle] = useState(thread.title || "")
  const [body, setBody] = useState(thread.body || "")
  const [location, setLocation] = useState(thread.meta?.place_id || "")
  const [time, setTime] = useState(thread.meta?.time || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [standardCity, setStandardCity] = useState<string | null>(thread.meta?.city_id || null)
  const [locationLat, setLocationLat] = useState<number | null>(thread.meta?.location_lat || null)
  const [locationLng, setLocationLng] = useState<number | null>(thread.meta?.location_lng || null)
  const [userPosition, setUserPosition] = useState<{ latitude: number; longitude: number } | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const pos = await getCurrentPosition()
        setUserPosition(pos)
      } catch {
        // ignore
      }
    })()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    const trimmedTitle = title.trim()
    const trimmedBody = body.trim()
    const trimmedLocation = location.trim()
    
    if (!trimmedTitle || !trimmedBody) {
      toast.error("Title and description are required")
      return
    }
    
    if (!trimmedLocation) {
      toast.error("Location is required for meetups")
      return
    }
    
    try {
      setIsSubmitting(true)
      
      // Get user's location information
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("standard_city, standard_country")
        .eq("id", thread.author_id)
        .single()
      
      // Update the meta information
      const updatedMeta = {
        ...thread.meta,
        place_id: trimmedLocation,
        time: time || extractTimeFromTitle(trimmedTitle),
        city_id: standardCity || userProfile?.standard_city || thread.meta?.city_id || normalizeCity(trimmedLocation),
        location_lat: locationLat ?? thread.meta?.location_lat ?? null,
        location_lng: locationLng ?? thread.meta?.location_lng ?? null,
      }
      
      // Update the thread
      const { error } = await supabase
        .from("forum_topics")
        .update({
          title: trimmedTitle,
          body: trimmedBody,
          meta: updatedMeta
        })
        .eq("id", thread.id)
      
      if (error) throw error
      
      toast.success("Meetup updated successfully")
      router.push(`/forum/thread/${thread.id}`)
      router.refresh()
    } catch (error: any) {
      console.error("Error updating meetup:", error)
      toast.error(error.message || "Failed to update meetup")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Helper function to extract time from title
  function extractTimeFromTitle(title: string): string | null {
    // Look for patterns like "3pm", "15:00", "3:00pm", etc.
    const timeRegex = /\b(\d{1,2})(:\d{2})?(\s*[ap]m)?\b/i
    const match = title.match(timeRegex)
    return match ? match[0] : null
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Meetup title"
          required
        />
      </div>
      
      <div>
        <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <Textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Describe your meetup"
          rows={4}
          required
        />
      </div>
      
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
          Location
        </label>
        <LocationInput
          value={location}
          onValueChange={setLocation}
          onPick={(loc) => {
            setLocation(loc.fullName)
            setStandardCity(normalizeCity(loc.city))
            setLocationLat(loc.latitude ?? null)
            setLocationLng(loc.longitude ?? null)
          }}
          placeholder="Location (required for meetups)"
          userPosition={userPosition}
          autoFocus={false}
        />
      </div>
      
      <div>
        <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
          Time (optional, can be included in title)
        </label>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <Input
            id="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            placeholder="e.g., 3pm, 15:00"
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/forum/thread/${thread.id}`)}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Updating..." : "Update Meetup"}
        </Button>
      </div>
    </form>
  )
}

