import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function TravelPlansPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle>Travel plans are temporarily disabled</CardTitle>
            <CardDescription>
              We’ve paused the legacy travel plans feature while we simplify the MVP. Messaging remains available.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Link href="/">
              <Button className="bg-emerald-600 hover:bg-emerald-700">Go to Dashboard</Button>
            </Link>
            <Link href="/chat">
              <Button variant="outline">Open Messages</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
