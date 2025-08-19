import { type NextRequest, NextResponse } from "next/server"
import { generateRecommendationsForFamily } from "@/lib/actions"

export async function POST(request: NextRequest) {
  try {
    const { familyId } = await request.json()

    if (!familyId) {
      return NextResponse.json({ error: "Family ID required" }, { status: 400 })
    }

    const result = await generateRecommendationsForFamily(familyId)

    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error("Error in generate-recommendations API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
