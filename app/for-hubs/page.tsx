"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MapPin, Users, Globe, Calendar, CheckCircle2, Shield, ArrowRight, TrendingUp, DollarSign, ChevronDown, Phone } from "lucide-react"
import LandingNav from "@/components/landing-nav"
import { useState } from "react"
import { motion, useInView, AnimatePresence } from "framer-motion"
import { useRef } from "react"

export default function ForHubsPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const cardVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  }

  const faqs = [
    {
      question: "How much does it cost?",
      answer: "Nothing. Zero. Free forever. We don't charge listing fees, take commissions, or have hidden costs. We believe connection shouldn't cost money."
    },
    {
      question: "What if I don't have a physical space?",
      answer: "That's fine! We list guided tours, curated experiences, and organized travel adventures. If families can participate and learn, we want you on Nearo."
    },
    {
      question: "How do families contact me?",
      answer: "Families discover you on Nearo, then we direct them to your website, social media, or preferred contact method. You get a lifetime connection - they become your followers, not ours. We're just the funnel."
    },
    {
      question: "Do you handle bookings or payments?",
      answer: "Nope. We don't touch bookings, payments, or take any commission. When families find you, they contact you directly and you handle everything your way. You keep 100% of revenue and full control of your customer relationships."
    },
    {
      question: "Can I be selective about who visits?",
      answer: "Absolutely. You control your own booking policies, requirements, and availability. Nearo is just the discovery layer - you decide who you work with."
    },
    {
      question: "What's the catch?",
      answer: "There isn't one. We're a bootstrapped community platform focused on connecting families, not extracting profit. We grow when the community thrives."
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-emerald-50">
      <LandingNav />

      {/* Hero Section - MUCH MORE AGGRESSIVE */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {/* Add urgency badge */}
          <motion.div
            variants={cardVariant}
            className="inline-flex items-center gap-2 bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-semibold mb-6"
          >
            <TrendingUp className="h-4 w-4" />
            Families are searching in your area right now
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-5xl md:text-6xl font-bold text-gray-900 mb-6"
          >
            Families Are Traveling.
            <span className="text-emerald-600"> Are They Finding You?</span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            Families around the world use Nearo to discover meaningful learning experiences while traveling.
            <span className="font-semibold text-gray-900"> Get discovered organically by families actively searching</span> —
            no ads, no marketing spend.
          </motion.p>

          {/* Two CTA buttons - primary and secondary */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <motion.a
              href="https://docs.google.com/forms/d/e/1FAIpQLSfZUjMFEDIgLfM9dpiLAqcxfG-grunOTkOUlRYMtGAPMkNR5g/viewform?usp=header"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-block"
            >
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 text-lg shadow-lg transition-shadow hover:shadow-xl">
                Claim Your Free Listing
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.a>
            <p className="text-sm text-gray-500">
              ✓ Free forever  ✓ 2-minute application  ✓ No credit card needed
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* NEW: The Opportunity Section - Show them what they're missing */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-emerald-600 to-blue-600 text-white">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold mb-12 text-center"
          >
            The Built-In Audience You're Missing
          </motion.h2>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            <motion.div
              variants={cardVariant}
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 transition-shadow hover:shadow-xl cursor-default"
            >
              <div className="text-5xl font-bold mb-2">1000+ families</div>
              <p className="text-emerald-100 text-lg">
                Network of families discovering new destinations
              </p>
            </motion.div>

            <motion.div
              variants={cardVariant}
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 transition-shadow hover:shadow-xl cursor-default"
            >
              <div className="text-5xl font-bold mb-2">$0</div>
              <p className="text-emerald-100 text-lg">
                You pay to be listed and discovered
              </p>
            </motion.div>

            <motion.div
              variants={cardVariant}
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 transition-shadow hover:shadow-xl cursor-default"
            >
              <div className="text-5xl font-bold mb-2">Early</div>
              <p className="text-emerald-100 text-lg">
                Join now and shape the platform with us
              </p>
            </motion.div>
          </motion.div>

          <div className="mt-12 bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <h3 className="text-2xl font-bold mb-4">Here's the reality:</h3>
            <ul className="space-y-3 text-lg">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 flex-shrink-0 mt-1" />
                <span>Families on Nearo are actively planning trips and looking for your exact type of experience</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 flex-shrink-0 mt-1" />
                <span>They're ready to book - they just need to know you exist</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 flex-shrink-0 mt-1" />
                <span>Your competitors (or future competitors) are already listing their spaces</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* What Qualifies as a Hub - Expanded and more inclusive */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold text-gray-900 mb-6 text-center"
          >
            What Counts as a Nearo Hub?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-gray-600 mb-4 text-center max-w-3xl mx-auto"
          >
            <span className="font-semibold text-gray-900">If families can learn, explore, or grow there - it's a hub.</span> We welcome all kinds of intentional learning experiences.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-md text-gray-500 mb-12 text-center max-w-2xl mx-auto italic"
          >
            Physical spaces, adventure experiences, guided tours - if it's meaningful for families, we want it on Nearo.
          </motion.p>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-6 mt-12"
          >
            <motion.div
              variants={cardVariant}
              whileHover={{ y: -4, scale: 1.02, borderColor: "rgb(52, 211, 153)" }}
              className="bg-emerald-50 rounded-xl p-6 border border-emerald-100 hover:shadow-lg transition-all cursor-default"
            >
              <h3 className="font-semibold text-gray-900 mb-2">🏫 Learning Centers</h3>
              <p className="text-gray-600 text-sm">
                Co-ops, homeschool hubs, tutoring centers, language schools, music studios
              </p>
            </motion.div>

            <motion.div
              variants={cardVariant}
              whileHover={{ y: -4, scale: 1.02, borderColor: "rgb(52, 211, 153)" }}
              className="bg-emerald-50 rounded-xl p-6 border border-emerald-100 hover:shadow-lg transition-all cursor-default"
            >
              <h3 className="font-semibold text-gray-900 mb-2">🎨 Creative Spaces</h3>
              <p className="text-gray-600 text-sm">
                Makerspaces, art studios, pottery workshops, coding labs, robotics centers
              </p>
            </motion.div>

            <motion.div
              variants={cardVariant}
              whileHover={{ y: -4, scale: 1.02, borderColor: "rgb(52, 211, 153)" }}
              className="bg-emerald-50 rounded-xl p-6 border border-emerald-100 hover:shadow-lg transition-all cursor-default"
            >
              <h3 className="font-semibold text-gray-900 mb-2">🌲 Outdoor Programs</h3>
              <p className="text-gray-600 text-sm">
                Forest schools, nature programs, surf camps, farm experiences, hiking guides
              </p>
            </motion.div>

            <motion.div
              variants={cardVariant}
              whileHover={{ y: -4, scale: 1.02, borderColor: "rgb(52, 211, 153)" }}
              className="bg-emerald-50 rounded-xl p-6 border border-emerald-100 hover:shadow-lg transition-all cursor-default"
            >
              <h3 className="font-semibold text-gray-900 mb-2">🚢 Travel Experiences</h3>
              <p className="text-gray-600 text-sm">
                Educational cruises, guided tours, cultural immersion programs, sailing adventures
              </p>
            </motion.div>

            <motion.div
              variants={cardVariant}
              whileHover={{ y: -4, scale: 1.02, borderColor: "rgb(52, 211, 153)" }}
              className="bg-emerald-50 rounded-xl p-6 border border-emerald-100 hover:shadow-lg transition-all cursor-default"
            >
              <h3 className="font-semibold text-gray-900 mb-2">📚 Community Spaces</h3>
              <p className="text-gray-600 text-sm">
                Libraries, museums, science centers, botanical gardens, historical sites
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section - Reframed as Business Opportunities */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold text-gray-900 mb-4 text-center"
          >
            Why Hub Owners Choose Nearo
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-gray-600 mb-12 text-center max-w-2xl mx-auto"
          >
            It's not just about being listed. It's about growing your community and filling your programs.
          </motion.p>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 gap-8"
          >
            <motion.div
              variants={cardVariant}
              whileHover={{ y: -4, scale: 1.01, borderColor: "rgb(52, 211, 153)" }}
              className="flex gap-4 bg-white p-6 rounded-xl border border-gray-200 hover:border-emerald-300 transition-all hover:shadow-lg cursor-default"
            >
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Fill Empty Capacity
                </h3>
                <p className="text-gray-600">
                  <span className="font-semibold">Have spots in your programs?</span> Traveling families need last-minute bookings.
                  Turn empty seats into revenue without lifting a finger.
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={cardVariant}
              whileHover={{ y: -4, scale: 1.01, borderColor: "rgb(52, 211, 153)" }}
              className="flex gap-4 bg-white p-6 rounded-xl border border-gray-200 hover:border-emerald-300 transition-all hover:shadow-lg cursor-default"
            >
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Zero Marketing Costs
                </h3>
                <p className="text-gray-600">
                  <span className="font-semibold">Stop paying for ads.</span> Our families are actively searching.
                  You get discovered organically by people already interested.
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={cardVariant}
              whileHover={{ y: -4, scale: 1.01, borderColor: "rgb(52, 211, 153)" }}
              className="flex gap-4 bg-white p-6 rounded-xl border border-gray-200 hover:border-emerald-300 transition-all hover:shadow-lg cursor-default"
            >
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Quality Over Quantity
                </h3>
                <p className="text-gray-600">
                  <span className="font-semibold">Not random tourists.</span> These are intentional, values-aligned families
                  who appreciate what you're building and respect your community.
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={cardVariant}
              whileHover={{ y: -4, scale: 1.01, borderColor: "rgb(52, 211, 153)" }}
              className="flex gap-4 bg-white p-6 rounded-xl border border-gray-200 hover:border-emerald-300 transition-all hover:shadow-lg cursor-default"
            >
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Globe className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Global Reach, Local Impact
                </h3>
                <p className="text-gray-600">
                  <span className="font-semibold">Get found internationally.</span> Families planning trips 6-12 months out
                  can discover you early and build their itinerary around your offerings.
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={cardVariant}
              whileHover={{ y: -4, scale: 1.01, borderColor: "rgb(52, 211, 153)" }}
              className="flex gap-4 bg-white p-6 rounded-xl border border-gray-200 hover:border-emerald-300 transition-all hover:shadow-lg cursor-default"
            >
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  You Keep 100% of Everything
                </h3>
                <p className="text-gray-600">
                  <span className="font-semibold">No commissions. No booking fees. No middleman.</span> We connect you directly with families.
                  They become your followers, not ours. You handle payments and bookings your way.
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={cardVariant}
              whileHover={{ y: -4, scale: 1.01, borderColor: "rgb(52, 211, 153)" }}
              className="flex gap-4 bg-white p-6 rounded-xl border border-gray-200 hover:border-emerald-300 transition-all hover:shadow-lg cursor-default"
            >
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Easy Event Management
                </h3>
                <p className="text-gray-600">
                  <span className="font-semibold">Coordinate effortlessly.</span> Post workshops, classes, or one-time events.
                  Families can RSVP and connect directly with you.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Requirements Section - Reframed Positively */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">
            What We Look For in Hubs
          </h2>
          <p className="text-lg text-gray-600 mb-12 text-center max-w-2xl mx-auto">
            We keep standards simple because we want genuine, intentional experiences for families.
          </p>

          <div className="bg-emerald-50 rounded-2xl p-8 border-2 border-emerald-200">
            <ul className="space-y-6">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">A Place to Gather</h3>
                  <p className="text-gray-600">
                    Physical location or organized travel experience -
                    somewhere families can actually participate
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Intentional Learning Focus</h3>
                  <p className="text-gray-600">
                    Educational, creative, or growth-oriented activities that families value and remember
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Family-Friendly Environment</h3>
                  <p className="text-gray-600">
                    Safe, welcoming, and appropriate for children - that's it
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Openness to Visitors</h3>
                  <p className="text-gray-600">
                    Willing to welcome traveling families for visits, drop-ins, workshops, or programs
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <p className="text-center text-gray-500 mt-8 italic">
            Don't meet every single criteria? Apply anyway. We're flexible and want to work with you.
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold text-gray-900 mb-4 text-center"
          >
            From Application to Live in 72 Hours
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-gray-600 mb-12 text-center max-w-2xl mx-auto"
          >
            We make onboarding ridiculously simple. You're 2 minutes away from getting discovered.
          </motion.p>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-4 gap-6"
          >
            <motion.div variants={cardVariant} className="text-center">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4 border-4 border-emerald-200 cursor-default"
              >
                <span className="text-2xl font-bold text-emerald-600">1</span>
              </motion.div>
              <h3 className="font-semibold text-gray-900 mb-2">Fill the Form</h3>
              <p className="text-sm text-gray-600">
                2-minute application with basic info about your hub
              </p>
            </motion.div>

            <motion.div variants={cardVariant} className="text-center">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4 border-4 border-emerald-200 cursor-default"
              >
                <span className="text-2xl font-bold text-emerald-600">2</span>
              </motion.div>
              <h3 className="font-semibold text-gray-900 mb-2">Quick Review</h3>
              <p className="text-sm text-gray-600">
                We verify you're a good fit (usually 1-3 days)
              </p>
            </motion.div>

            <motion.div variants={cardVariant} className="text-center">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4 border-4 border-emerald-200 cursor-default"
              >
                <span className="text-2xl font-bold text-emerald-600">3</span>
              </motion.div>
              <h3 className="font-semibold text-gray-900 mb-2">You're Live</h3>
              <p className="text-sm text-gray-600">
                Your hub appears instantly on Nearo for all to see
              </p>
            </motion.div>

            <motion.div variants={cardVariant} className="text-center">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4 border-4 border-emerald-200 cursor-default"
              >
                <span className="text-2xl font-bold text-emerald-600">4</span>
              </motion.div>
              <h3 className="font-semibold text-gray-900 mb-2">Get Discovered</h3>
              <p className="text-sm text-gray-600">
                Families find you, connect, and start booking
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Trust & Safety Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-6">
            <Shield className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            We Protect Our Community
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Every hub is reviewed before going live. We maintain clear standards and support
            both hub owners and families to ensure everyone has a positive experience.
          </p>
          <Link href="/safety">
            <Button variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50">
              Read Our Safety Guidelines
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* FAQ Section - Accordion */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-emerald-50 to-white">
        <div className="max-w-3xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold text-gray-900 mb-12 text-center"
          >
            Common Questions
          </motion.h2>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="space-y-4"
          >
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                variants={cardVariant}
                whileHover={{ scale: 1.01 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md hover:border-emerald-300"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-6 text-left focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-inset"
                >
                  <h3 className="font-semibold text-gray-900 pr-4">{faq.question}</h3>
                  <motion.div
                    animate={{ rotate: openFaq === index ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <ChevronDown className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-6 text-gray-600">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>

          {/* Call to Action - Book a Call */}
          <div className="mt-12 text-center">
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-emerald-200">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
                <Phone className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Still Have Questions?
              </h3>
              <p className="text-gray-600 mb-6 max-w-xl mx-auto">
                Book a free 15-minute call with Aaron. We'll walk through how Nearo works,
                answer your questions, and see if it's a good fit for your hub.
              </p>
              <motion.a
                href="https://cal.com/aaron-herholdt-jrvb8c/15min"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-block"
              >
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 transition-shadow hover:shadow-xl">
                  <Phone className="mr-2 h-5 w-5" />
                  Book a 15-Minute Call
                </Button>
              </motion.a>
              <p className="text-xs text-gray-500 mt-3">
                Zero pressure. Just a friendly chat about your hub.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section - More Aggressive */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-emerald-600 to-blue-600 text-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold mb-6"
          >
            ⚡ Early hub owners get prime placement
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-4xl md:text-5xl font-bold mb-6"
          >
            Don't Leave Families On The Table
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl mb-8 max-w-2xl mx-auto opacity-95"
          >
            Right now, families are planning their next trip and searching for experiences.
            The question is: <span className="font-bold underline">Will they find you or your competitor?</span>
          </motion.p>

          <motion.a
            href="https://docs.google.com/forms/d/e/1FAIpQLSfZUjMFEDIgLfM9dpiLAqcxfG-grunOTkOUlRYMtGAPMkNR5g/viewform?usp=header"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="inline-block"
          >
            <Button size="lg" className="bg-white text-emerald-600 hover:bg-gray-100 px-10 py-7 text-xl shadow-2xl hover:shadow-3xl transition-all">
              Get Your Hub Listed Now
              <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </motion.a>

          <p className="text-sm text-white/90 mt-6">
            ✓ Takes 2 minutes  ✓ Free forever  ✓ Live in 1-3 days  ✓ Cancel anytime (but you won't want to)
          </p>

          <div className="mt-12 pt-8 border-t border-white/20">
            <p className="text-white/80 text-sm mb-3">
              Questions? Email us at <a href="mailto:hello@nearo.forum" className="underline font-semibold">hello@nearo.forum</a>
            </p>
            <p className="text-white/80 text-sm">
              Or <a href="https://cal.com/aaron-herholdt-jrvb8c/15min" target="_blank" rel="noopener noreferrer" className="underline font-semibold">book a 15-minute call with Aaron</a>
            </p>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <MapPin className="h-6 w-6 text-emerald-400 mr-2" />
            <span className="text-xl font-bold">Nearo</span>
          </div>
          <p className="text-gray-400 text-sm">
            Building community for families, everywhere.
          </p>
        </div>
      </footer>
    </div>
  )
}
