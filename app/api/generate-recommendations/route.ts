import { type NextRequest, NextResponse } from "next/server"

export async function POST(_request: NextRequest) {
  return NextResponse.json({ error: "Recommendations are disabled in MVP" }, { status: 501 })
}
