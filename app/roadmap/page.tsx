import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Rocket, Megaphone, Globe, Sparkles } from "lucide-react"
import Link from "next/link"
import Timeline from "@/components/timeline"
import { MobileBackButton } from "@/components/ui/mobile-back-button"
import LandingNav from "@/components/landing-nav"

export const metadata = {
  title: 'Roadmap - Nearo',
  description: 'See our journey and what\'s coming next for Nearo - connecting homeschool families worldwide.',
}

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      <LandingNav />
      <div className="p-4 md:hidden">
        <MobileBackButton href="/" />
      </div>
      {/* Header */}
      <header className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4 md:mb-6">
            <div className="relative size-16 md:size-20 rounded-full bg-emerald-50 flex items-center justify-center">
              <Rocket className="h-8 w-8 text-emerald-600 md:h-12 md:w-12" />
              <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-orange-400 rounded-full animate-pulse md:w-5 md:h-5"></div>
            </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-3 md:mb-4">
            Nearo Roadmap
          </h1>
          <p className="text-base text-gray-600 max-w-2xl mx-auto md:text-xl">
            We're building the ultimate platform for families to connect, travel, and grow together.
            Here's our vision for the future.
          </p>
        </div>
      </header>

      {/* Mission Statement */}
      <section className="py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-6 md:p-8 text-center bg-gradient-to-r from-emerald-500 to-blue-600 text-white rounded-2xl">
            <h2 className="text-xl md:text-3xl font-bold mb-3 md:mb-4">
              Our Mission
            </h2>
            <p className="text-base md:text-xl leading-relaxed">
              To create a safe, vibrant community where families can discover meaningful connections,
              share adventures, and build lifelong friendships — whether they're meeting locally or traveling the world.
            </p>
          </Card>
        </div>
      </section>

      {/* Vision */}
      <section className="py-10 md:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 items-center lg:grid-cols-2">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Our Vision</h2>
              <p className="text-base text-gray-600 mb-6 md:text-lg">
                We envision a world where families never feel isolated. Through Nearo,
                parents can find trusted communities, plan amazing trips, and create memories that
                will last a lifetime with like-minded families.
              </p>
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-700 md:text-base">Connect with families who share your values and educational approach</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-700 md:text-base">Discover amazing destinations and plan group travel adventures</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-700 md:text-base">Build lasting friendships through local meetups and shared experiences</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="mx-auto max-w-sm aspect-square bg-gradient-to-br from-emerald-100 to-blue-100 rounded-2xl flex items-center justify-center">
                <Globe className="h-24 w-24 text-emerald-600 md:h-32 md:w-32" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KPI cards */}
      <section className="py-10 md:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-6 md:mb-8">Growth & Reach</h2>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="p-4 rounded-2xl">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm md:text-base">
                <Rocket className="h-4 w-4" /> Growth Targets (families)
              </div>
              <p className="mt-1 text-xs text-gray-600 md:text-sm">100 → 300 → 600 → 1,200 → 2,400 → 4,800</p>
            </Card>
            <Card className="p-4 rounded-2xl">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm md:text-base">
                <Megaphone className="h-4 w-4" /> Primary Channel
              </div>
              <p className="mt-1 text-xs text-gray-600 md:text-sm">Homeschool Facebook groups + community invites + local partner perks</p>
            </Card>
            <Card className="p-4 rounded-2xl">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm md:text-base">
                <Globe className="h-4 w-4" /> Geographic Expansion
              </div>
              <p className="mt-1 text-xs text-gray-600 md:text-sm">Ambassadors piloting new cities as the community grows</p>
            </Card>
          </div>

          <Card className="p-4 mt-4 rounded-2xl">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm md:text-base">
              <span>Monetization Approach</span>
            </div>
            <p className="mt-1 text-xs text-gray-600 md:text-sm">
              Always free. Community-first. Later: local partner discounts near meetups and tasteful, relevant ads.
            </p>
          </Card>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-10 md:py-12">
        <div className="px-2 sm:px-4">
          <Timeline />
        </div>
      </section>

      {/* CTA */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 rounded-2xl">
            <div>
              <h3 className="text-xl font-bold text-gray-900 md:text-2xl">Build Nearo with us</h3>
              <p className="mt-1 text-sm text-gray-600 md:text-base">
                Join the community, share feedback, and help us prioritize the next release.
              </p>
            </div>
            <div className="flex flex-col w-full gap-3 sm:flex-row sm:w-auto">
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href="/auth/login">I'm already a member</Link>
              </Button>
              <Button asChild className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto">
                <Link href="/auth/sign-up">Create my free account</Link>
              </Button>
            </div>
          </Card>
        </div>
      </section>

      <footer className="pb-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-500 md:text-sm">
          <p className="flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4" />
            Built with community feedback — updated as we grow.
          </p>
        </div>
      </footer>
    </div>
  )
}
