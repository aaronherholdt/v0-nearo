"use client"

import { Button } from "@/components/ui/button"
import {
  MapPin,
  Menu,
  Rocket,
  ShieldCheck,
  HelpCircle,
  Building2,
} from "lucide-react"
import Link from "next/link"
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

export default function LandingNav() {
  return (
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
  )
}
