import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Heart, ArrowRight, Share2, ArrowLeft } from "lucide-react"

export default async function ThankYouPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/forum">
            <Button variant="ghost" className="text-gray-600 hover:text-emerald-600">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Forum
            </Button>
          </Link>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-emerald-200 p-8 md:p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-6">
            <Heart className="h-10 w-10 text-emerald-600 fill-emerald-600" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            You Just Kept Nearo Alive ❤️
          </h1>

          <p className="text-2xl font-semibold text-emerald-600 mb-8">
            Thank you.
          </p>

          <div className="prose prose-lg max-w-none space-y-6 text-gray-700 mb-12">
            <p className="text-lg leading-relaxed">
              Because of you, a family moving to Portugal next week will find
              their community.
            </p>

            <p className="text-lg leading-relaxed">
              Because of you, a single parent feeling isolated will discover
              they're not alone.
            </p>

            <p className="text-lg leading-relaxed">
              Because of you, Nearo stays free for everyone, forever.
            </p>

            <p className="text-xl font-semibold text-gray-900 mt-8">
              You didn't just donate to a platform. You opened doors for families
              who desperately need what you found here. That matters more than you
              know.
            </p>
          </div>

          <div className="border-t border-gray-200 pt-8 mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              What's next?
            </h2>

            <div className="grid gap-4 md:grid-cols-3 mb-8">
              <div className="bg-emerald-50 rounded-lg p-6 border border-emerald-100">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-full mb-3">
                  <ArrowRight className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Keep Connecting
                </h3>
                <p className="text-sm text-gray-600">
                  Head back to the forum and continue building community
                </p>
              </div>

              <div className="bg-emerald-50 rounded-lg p-6 border border-emerald-100">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-full mb-3">
                  <Share2 className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Spread the Word
                </h3>
                <p className="text-sm text-gray-600">
                  Share Nearo with other homeschooling families you know
                </p>
              </div>

              <div className="bg-emerald-50 rounded-lg p-6 border border-emerald-100">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-full mb-3">
                  <Heart className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Feel Good
                </h3>
                <p className="text-sm text-gray-600">
                  Know that you're making a real difference
                </p>
              </div>
            </div>

            <Link href="/forum">
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-6 text-lg"
              >
                Return to Forum
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          <p className="text-lg italic text-gray-600 mt-12">
            Thank you for believing in this community.
          </p>

          <p className="text-lg font-semibold text-gray-900 mt-4">
            With deep gratitude,
            <br />
            Aaron
          </p>
        </div>
      </div>
    </div>
  )
}
