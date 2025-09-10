import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function NewTravelPlanPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/travel-plans">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Travel Plans
            </Link>
          </Button>
        </div>
        <div className="max-w-2xl">
          <div className="border rounded-lg p-6 bg-white">
            <p className="text-gray-700">Creating trips is temporarily disabled.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
