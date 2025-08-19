"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, MapPin } from "lucide-react"
import { createTravelPlan } from "@/lib/actions"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating travel plan...
        </>
      ) : (
        "Create Travel Plan"
      )}
    </Button>
  )
}

interface TravelPlanFormProps {
  initialData?: {
    title: string
    description: string
    destination: string
    latitude: number
    longitude: number
    start_date: string
    end_date: string
    is_active: boolean
  }
}

export default function TravelPlanForm({ initialData }: TravelPlanFormProps) {
  const [state, formAction] = useActionState(createTravelPlan, null)
  const [destination, setDestination] = useState(initialData?.destination || "")

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <Card>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <MapPin className="h-8 w-8 text-emerald-600 mr-2" />
              </div>
              <CardTitle className="text-2xl">Add Travel Plan</CardTitle>
              <CardDescription>
                Share your travel destination and dates to connect with other homeschooling families
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

                <div className="space-y-2">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Trip Title *
                  </label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Summer vacation in Barcelona"
                    required
                    className="w-full"
                    defaultValue={initialData?.title}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="destination" className="block text-sm font-medium text-gray-700">
                    Destination *
                  </label>
                  <Input
                    id="destination"
                    name="destination"
                    placeholder="Barcelona, Spain"
                    required
                    className="w-full"
                    defaultValue={initialData?.destination}
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">Enter city, country or specific location</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                      Start Date *
                    </label>
                    <Input
                      id="start_date"
                      name="start_date"
                      type="date"
                      required
                      className="w-full"
                      defaultValue={initialData?.start_date}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                      End Date *
                    </label>
                    <Input
                      id="end_date"
                      name="end_date"
                      type="date"
                      required
                      className="w-full"
                      defaultValue={initialData?.end_date}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Tell other families about your travel plans, what you're hoping to see and do, and what kind of meetups you'd be interested in..."
                    rows={4}
                    className="w-full"
                    defaultValue={initialData?.description}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    defaultChecked={initialData?.is_active ?? true}
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700">
                    Make this travel plan active (visible to other families)
                  </label>
                </div>

                <SubmitButton />
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:sticky lg:top-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <MapPin className="h-5 w-5 text-emerald-600 mr-2" />
                Where you'll be
              </CardTitle>
              <CardDescription>{destination || "Enter a destination to see it highlighted"}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-96 lg:h-[500px] w-full rounded-b-lg overflow-hidden">
                {destination ? (
                  <div className="h-full bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center text-gray-700 p-6">
                    <div className="text-center max-w-sm">
                      <MapPin className="h-16 w-16 mx-auto mb-4 text-emerald-500" />
                      <h3 className="text-xl font-semibold mb-2">{destination}</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Your travel destination is set! Other families traveling to this area will be able to find and
                        connect with you.
                      </p>
                      <div className="bg-white rounded-lg p-3 text-xs">
                        <p className="font-medium text-emerald-600">✓ Destination saved</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full bg-gray-100 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>Enter a destination to preview your travel plan</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
