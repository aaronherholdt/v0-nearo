import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface TravelPlanPageProps { params: { id: string } }

export default async function TravelPlanPage({ params }: TravelPlanPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/travel-plans">Back to Travel Plans</Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Trip details unavailable</CardTitle>
            <CardDescription>This page is disabled while we remove dependencies on legacy tables.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">ID: {params.id}</p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
