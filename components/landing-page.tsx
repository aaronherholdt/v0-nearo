"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  MapPin,
  Users,
  MessageCircle,
  Globe,
  Heart,
  Plane,
  Camera,
  BookOpen,
  Star,
  ArrowRight,
  CheckCircle,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

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
            <div className="flex items-center">
              <div className="relative">
                <MapPin className="h-8 w-8 text-emerald-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
              </div>
              <span className="ml-2 text-2xl font-bold text-emerald-600 font-sans">nearo</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" asChild>
                <Link href="/auth/sign-up">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            transform: `translateY(${scrollY * 0.5}px)`,
            backgroundImage: `url('/world-travel-map.png')`,
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
          <div
            className={`text-center transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >

            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 font-sans">
              Connect, Explore, and
              <span className="text-emerald-600 block">Learn Together!</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
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
          </div>
        </div>

      </section>

      {/* How It Works */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-sans">Find Your Travel Tribe!</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Connect with like-minded families in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Pin Your Journey",
                description: "Add your travel destinations and dates to your family profile",
                icon: MapPin,
                color: "emerald",
              },
              {
                step: "2",
                title: "Discover Matches",
                description: "Find families traveling to the same places at the same time",
                icon: Users,
                color: "blue",
              },
              {
                step: "3",
                title: "Connect & Explore",
                description: "Message matched families and plan amazing meetups together",
                icon: MessageCircle,
                color: "purple",
              },
            ].map((item, index) => (
              <Card
                key={index}
                className={`relative overflow-hidden border-2 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 ${
                  item.color === "emerald"
                    ? "border-emerald-200 hover:border-emerald-400"
                    : item.color === "blue"
                      ? "border-blue-200 hover:border-blue-400"
                      : "border-purple-200 hover:border-purple-400"
                }`}
              >
                <div
                  className={`absolute top-0 left-0 w-full h-2 ${
                    item.color === "emerald"
                      ? "bg-emerald-500"
                      : item.color === "blue"
                        ? "bg-blue-500"
                        : "bg-purple-500"
                  }`}
                />

                <CardHeader className="text-center pt-8">
                  <div
                    className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 mx-auto ${
                      item.color === "emerald"
                        ? "bg-emerald-100"
                        : item.color === "blue"
                          ? "bg-blue-100"
                          : "bg-purple-100"
                    }`}
                  >
                    <item.icon
                      className={`h-8 w-8 ${
                        item.color === "emerald"
                          ? "text-emerald-600"
                          : item.color === "blue"
                            ? "text-blue-600"
                            : "text-purple-600"
                      }`}
                    />
                  </div>
                  <div
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm mb-4 ${
                      item.color === "emerald"
                        ? "bg-emerald-500"
                        : item.color === "blue"
                          ? "bg-blue-500"
                          : "bg-purple-500"
                    }`}
                  >
                    {item.step}
                  </div>
                  <CardTitle className="text-xl font-bold">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-base">{item.description}</CardDescription>
                </CardContent>
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
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-sans">Families Love nearo</h2>
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
                quote: "nearo turned our solo travels into amazing community experiences. Highly recommend!",
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

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-emerald-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 font-sans">Ready to Start Your Adventure?</h2>
          <p className="text-xl mb-12 opacity-90">
            Join thousands of families creating amazing memories together around the world.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button size="lg" className="bg-white text-emerald-600 hover:bg-gray-100 text-lg px-8 py-4 h-auto" asChild>
              <Link href="/auth/sign-up">
                Create Your Family Profile
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
              <span className="text-2xl font-bold font-sans">nearo</span>
            </div>
            <div className="text-gray-400">© 2024 nearo. Connecting homeschooling families worldwide.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
