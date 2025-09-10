import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface EditTravelPlanPageProps { params: { id: string } }

export default async function EditTravelPlanPage({ params }: EditTravelPlanPageProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-4">
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Link href={`/forum`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Post
          </Link>
        </Button>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="border rounded-lg p-6 bg-white">
          <p className="text-gray-700">Editing trips is temporarily disabled.</p>
        </div>
      </div>
    </div>
  )
}
