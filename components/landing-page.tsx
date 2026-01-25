"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  MapPin,
  Users,
  MessageCircle,
  Globe,
  Plane,
  Camera,
  BookOpen,
  Star,
  ArrowRight,
  CheckCircle,
  Menu,
  Rocket,
  ShieldCheck,
  HelpCircle,
  Building2,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    setIsVisible(true)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md border-b border-emerald-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <div className="relative">
                <MapPin className="h-8 w-8 text-emerald-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
              </div>
              <span className="ml-2 text-2xl font-bold text-emerald-600 font-sans">Nearo</span>
            </Link>

            <div className="hidden sm:flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href="/for-hubs">List Your Hub</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/roadmap">Roadmap</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/safety">Safety</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/faq">FAQs</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" asChild>
                <Link href="/auth/sign-up">Get Started</Link>
              </Button>
            </div>

            <Sheet>
              <SheetTrigger className="sm:hidden inline-flex items-center justify-center rounded-md p-2 text-emerald-700 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open navigation</span>
              </SheetTrigger>
              <SheetContent side="right" className="sm:hidden w-full border-l border-emerald-100 bg-gradient-to-b from-white to-emerald-50">
                <SheetHeader className="border-b border-emerald-100 pb-4">
                  <SheetTitle className="text-2xl font-bold text-emerald-800">Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col space-y-2 mt-8 px-2">
                  <SheetClose asChild>
                    <Link
                      href="/for-hubs"
                      className="text-xl font-semibold text-gray-900 hover:text-emerald-600 hover:bg-emerald-100/50 active:bg-emerald-200/50 transition-all duration-200 py-4 px-3 rounded-lg border-b border-emerald-100 flex items-center"
                    >
                      <div className="mr-3 bg-emerald-100 p-2 rounded-full">
                        <Building2 className="h-5 w-5 text-emerald-600" />
                      </div>
                      List Your Hub
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      href="/roadmap"
                      className="text-xl font-semibold text-gray-900 hover:text-emerald-600 hover:bg-emerald-100/50 active:bg-emerald-200/50 transition-all duration-200 py-4 px-3 rounded-lg border-b border-emerald-100 flex items-center"
                    >
                      <div className="mr-3 bg-emerald-100 p-2 rounded-full">
                        <Rocket className="h-5 w-5 text-emerald-600" />
                      </div>
                      Roadmap
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      href="/safety"
                      className="text-xl font-semibold text-gray-900 hover:text-emerald-600 hover:bg-emerald-100/50 active:bg-emerald-200/50 transition-all duration-200 py-4 px-3 rounded-lg border-b border-emerald-100 flex items-center"
                    >
                      <div className="mr-3 bg-emerald-100 p-2 rounded-full">
                        <ShieldCheck className="h-5 w-5 text-emerald-600" />
                      </div>
                      Safety
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      href="/faq"
                      className="text-xl font-semibold text-gray-900 hover:text-emerald-600 hover:bg-emerald-100/50 active:bg-emerald-200/50 transition-all duration-200 py-4 px-3 rounded-lg border-b border-emerald-100 flex items-center"
                    >
                      <div className="mr-3 bg-emerald-100 p-2 rounded-full">
                        <HelpCircle className="h-5 w-5 text-emerald-600" />
                      </div>
                      FAQs
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      href="/legal/data-retention"
                      className="text-xl font-semibold text-gray-900 hover:text-emerald-600 hover:bg-emerald-100/50 active:bg-emerald-200/50 transition-all duration-200 py-4 px-3 rounded-lg border-b border-emerald-100 flex items-center"
                    >
                      <div className="mr-3 bg-emerald-100 p-2 rounded-full">
                        <ShieldCheck className="h-5 w-5 text-emerald-600" />
                      </div>
                      Data Retention
                    </Link>
                  </SheetClose>
                </div>
                <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                  <div className="flex items-center opacity-70">
                    <div className="relative">
                      <MapPin className="h-6 w-6 text-emerald-600" />
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                    </div>
                    <span className="ml-2 text-lg font-bold text-emerald-600 font-sans">Nearo</span>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-10 pb-32 overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            transform: `translateY(${scrollY * 0.5}px)`,
            backgroundImage: `url('/world-travel-map.png')`,
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
          <div
            className={`text-center transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >

            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 font-sans">
              Meet families nearby <span className="text-emerald-600">and when travelling</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Join a community of adventurous families around the globe. Find your travel tribe, local lovelies and create
              unforgettable learning experiences together.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8 py-4 h-auto" asChild>
                <Link href="/auth/sign-up">
                  Start Your Adventure Today!
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-4 h-auto bg-transparent" asChild>
                <Link href="/auth/login">
                  <Plane className="mr-2 h-5 w-5" />
                  I'm Already a Member
                </Link>
              </Button>
            </div>
            <div className="mt-6 animate-pulse">
              <p className="text-center font-bold text-emerald-600 text-xl px-4 py-2 rounded-full bg-emerald-50 border-2 border-emerald-200 inline-block shadow-md">
                Free forever. We shouldn't be paying to find connections.
              </p>
            </div>
          </div>
        </div>

      </section>

      {/* What is Nearo */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 font-sans">What is Nearo?</h2>
          <p className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
            Meet like-minded families locally and on the road. Discover trips and meetups, message safely, and plan kid-friendly adventures.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-sans">How it works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Connect with like-minded families in four simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Create a profile",
                description: "Set up your family profile with your interests and travel plans",
                image: "/profile.png",
              },
              {
                title: "Find local or travel matches",
                description: "Discover families near you or traveling to the same destinations",
                image: "/matches.png",
              },
              {
                title: "Message & plan",
                description: "Connect safely and coordinate your meetups and adventures",
                image: "/messages.png",
              },
              {
                title: "Meet up safely",
                description: "Meet families safely for kid-friendly activities and trips",
                image: "/meetup.png",
              },
            ].map((item, index) => (
              <Card
                key={index}
                className="relative overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 rounded-xl"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url('${item.image}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-700/90 via-emerald-600/50 to-transparent" />

                <div className="relative z-10 h-64 sm:h-72 flex flex-col justify-end px-6 pt-6 pb-1">
                  <CardTitle className="text-white text-xl font-bold text-center drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="text-emerald-50 text-base text-center drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
                    {item.description}
                  </CardDescription>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-r from-emerald-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-sans">Share Your Journey!</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to connect with amazing homeschooling families worldwide
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: MapPin, title: "Travel Planning", description: "Pin destinations and dates", color: "emerald" },
              { icon: Users, title: "Smart Matching", description: "Find compatible families", color: "blue" },
              {
                icon: MessageCircle,
                title: "Secure Messaging",
                description: "Chat safely with matches",
                color: "purple",
              },
              { icon: Globe, title: "Global Community", description: "Connect worldwide", color: "orange" },
            ].map((feature, index) => (
              <Card
                key={index}
                className="text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <CardHeader>
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 mx-auto ${
                      feature.color === "emerald"
                        ? "bg-emerald-100"
                        : feature.color === "blue"
                          ? "bg-blue-100"
                          : feature.color === "purple"
                            ? "bg-purple-100"
                            : "bg-orange-100"
                    }`}
                  >
                    <feature.icon
                      className={`h-6 w-6 ${
                        feature.color === "emerald"
                          ? "text-emerald-600"
                          : feature.color === "blue"
                            ? "text-blue-600"
                            : feature.color === "purple"
                              ? "text-purple-600"
                              : "text-orange-600"
                      }`}
                    />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-sans">Families Love Nearo</h2>
            <p className="text-xl text-gray-600">Real stories from our amazing community</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah & Mike Johnson",
                location: "California, USA",
                children: "Ages 8, 12, 15",
                quote:
                  "We've met incredible families in Spain, Italy, and France! Our kids have made lifelong friends.",
                rating: 5,
              },
              {
                name: "Emma & David Chen",
                location: "Toronto, Canada",
                children: "Ages 6, 9",
                quote: "Nearo turned our solo travels into amazing community experiences. Highly recommend!",
                rating: 5,
              },
              {
                name: "Lisa & Tom Rodriguez",
                location: "Austin, Texas",
                children: "Ages 7, 11, 14",
                quote: "The app is so easy to use and we've connected with families in 12 countries so far!",
                rating: 5,
              },
            ].map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mr-4">
                      <Users className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                      <CardDescription>{testimonial.location}</CardDescription>
                    </div>
                  </div>
                  <div className="flex mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">"{testimonial.quote}"</p>
                  <Badge variant="secondary">{testimonial.children}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Hub Owners CTA */}
      <section className="py-20 bg-white border-t border-b border-emerald-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-2xl p-8 md:p-12 text-center border border-emerald-200">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-6">
              <MapPin className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Do You Run a Learning Space?
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Join our network of educational hubs and connect with traveling
              homeschooling families from around the world. Free to list.
            </p>
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 text-lg h-auto" asChild>
              <Link href="/for-hubs">
                List Your Hub
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-emerald-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 font-sans">Start free</h2>
          <p className="text-xl mb-12 opacity-90">
            Join thousands of families creating amazing memories together around the world.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button size="lg" className="bg-white text-emerald-600 hover:bg-gray-100 text-lg px-8 py-4 h-auto" asChild>
              <Link href="/auth/sign-up">
                Find families near me
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-emerald-600 text-lg px-8 py-4 h-auto bg-transparent"
              asChild
            >
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>
          <div className="mb-6 animate-pulse">
            <p className="text-center font-bold text-white text-xl px-6 py-3 rounded-full bg-emerald-500/30 border-2 border-white/50 inline-block shadow-lg">
              Free forever. We shouldn't be paying to find connections.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { icon: CheckCircle, text: "100% Free to Join" },
              { icon: CheckCircle, text: "Safe & Secure" },
              { icon: CheckCircle, text: "Global Community" },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-center">
                <item.icon className="h-5 w-5 mr-2" />
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <MapPin className="h-8 w-8 text-emerald-400 mr-2" />
              <span className="text-2xl font-bold font-sans">Nearo</span>
            </div>
            <div className="text-gray-400">© 2024 Nearo. Connecting homeschooling families worldwide.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
