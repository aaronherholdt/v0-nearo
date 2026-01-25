"use client"

import { useRef, useState } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, ShieldCheck, MessageCircle, Plane, MapPin, Megaphone, Sparkles, Rocket, ChevronDown } from "lucide-react"

// QUARTER-BASED, REALISTIC ROADMAP — aligned with your requested start
// Q4 2025: launch core matches + private messaging + FB beta + Europe tour test
// Q1 2026: community-driven features + safety enhancements
// Q2 2026 (stretch): mobile PWA + push + moderation + events RSVP/Groups

const quarters = [
  {
    label: "Q4 · 2025",
    monthsTargets: [
      { m: "Oct", target: 100 },
      { m: "Nov", target: 300 },
      { m: "Dec", target: 600 },
    ],
    headline: "Launch core matching & seed the community",
    bullets: [
      { icon: MapPin, text: "Basic Smart Matching: families nearby + upcoming trips overlap" },
      { icon: Plane, text: "Trips Match + Meetups Match (MVP)" },
      { icon: MessageCircle, text: "Private messaging (only between matches)" },
      { icon: Megaphone, text: "Create Facebook group for beta testers; daily value posts" },
      { icon: Sparkles, text: "Personal test during European tour; fix bugs quickly" },
    ],
    tags: ["MVP", "Community", "Matching", "Messaging", "Beta"],
  },
  {
    label: "Q1 · 2026",
    monthsTargets: [
      { m: "Jan", target: 1200 },
      { m: "Feb", target: 2400 },
      { m: "Mar", target: 4800 },
    ],
    headline: "Top‑requested features + safety & trust",
    bullets: [
      { icon: Calendar, text: "Events Calendar + Travel Mode (toggle temporary city/ dates)" },
      { icon: Users, text: "Ambassador program in 2–3 new cities; community invites (no payouts) + shareable invite cards" },
      { icon: ShieldCheck, text: "Safety upgrades: report/block, Safety Center, meetup guidelines" },
      { icon: Sparkles, text: "Public feedback loop: in‑app upvotes for features; ship weekly small wins" },
    ],
    tags: ["Safety", "Events", "Travel Mode", "Community"],
  },
  {
    label: "Q2 · 2026 (stretch)",
    monthsTargets: [
      { m: "Apr", target: 7200 },
      { m: "May", target: 9600 },
      { m: "Jun", target: 14400 },
    ],
    headline: "Scale experience: mobile, notifications, groups & partner perks",
    bullets: [
      { icon: Rocket, text: "Mobile PWA polish + push notifications; add homescreen install prompts" },
      { icon: Users, text: "Group chats for meetups; RSVP & attendance tracking" },
      { icon: ShieldCheck, text: "Moderation queue + word filters; location‑privacy controls" },
      { icon: MessageCircle, text: "Messaging quality: read state, attachments (photos), quick replies" },
      { icon: Megaphone, text: "Partner Perks Program: local restaurant discounts near meetups; partner badges; sponsored meetups" },
      { icon: Megaphone, text: "Monetization (exploration): tasteful, relevant ads; co-op/curriculum brand collaborations" },
    ],
    tags: ["Mobile", "Notifications", "Groups", "Moderation", "Partnerships"],
  },
]

export default function Timeline() {
  const ref = useRef<HTMLDivElement | null>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 20%", "end end"] })
  const [expandedQuarters, setExpandedQuarters] = useState<Set<number>>(new Set())

  const lineScaleY = useTransform(scrollYProgress, [0, 1], [0.05, 1])
  const lineOpacity = useTransform(scrollYProgress, [0, 0.05, 1], [0.2, 0.9, 1])

  const toggleQuarter = (index: number) => {
    const newExpanded = new Set(expandedQuarters)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedQuarters(newExpanded)
  }

  return (
    <div ref={ref} className="relative mx-auto max-w-5xl">
      {/* Static rail */}
      <div className="absolute left-6 md:left-8 top-0 bottom-0 w-[2px] bg-emerald-100" />
      {/* Progress rail */}
      <motion.div
        style={{ scaleY: lineScaleY, opacity: lineOpacity, originY: 0 }}
        className="absolute left-6 md:left-8 top-0 w-[2px] bg-emerald-500"
      />

      <div className="space-y-10 md:space-y-14">
        {quarters.map((q, idx) => (
          <motion.section
            key={q.label}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ type: "spring", stiffness: 90, damping: 18, delay: idx * 0.05 }}
            className="relative pl-16 md:pl-24"
          >
            {/* Node */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 200, damping: 16 }}
              className="absolute left-0 md:left-2 mt-1 h-9 w-9 rounded-full bg-white ring-4 ring-emerald-100 flex items-center justify-center"
            >
              <div className="h-3.5 w-3.5 rounded-full bg-emerald-500" />
            </motion.div>

            <Card
              className="p-5 md:p-7 bg-white/90 backdrop-blur border-emerald-100 cursor-pointer hover:bg-white/95 transition-colors"
              onClick={() => toggleQuarter(idx)}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900">{q.label} - {q.headline}</h3>
                <motion.div
                  animate={{ rotate: expandedQuarters.has(idx) ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-5 w-5 text-emerald-600" />
                </motion.div>
              </div>

              <motion.div
                initial={false}
                animate={{
                  height: expandedQuarters.has(idx) ? "auto" : 0,
                  opacity: expandedQuarters.has(idx) ? 1 : 0
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="pt-4 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2 text-xs md:text-sm text-emerald-700 font-medium">
                      <Calendar className="h-4 w-4" />
                      <span>{q.label}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                      {/* Month chips with targets */}
                      {q.monthsTargets.map(({ m, target }) => (
                        <span key={m} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 border border-emerald-100">
                          <span className="font-medium text-emerald-800">{m}</span>
                          <span className="text-[11px] text-emerald-700">{target.toLocaleString()}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <ul className="grid gap-2 text-gray-700 text-sm md:text-base">
                    {q.bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <b.icon className="h-4 w-4 text-emerald-600 mt-0.5" />
                        <span>{b.text}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-wrap gap-2">
                    {q.tags.map((t) => (
                      <Badge key={t} variant="secondary" className="bg-emerald-50 text-emerald-800 border border-emerald-100">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              </motion.div>
            </Card>
          </motion.section>
        ))}
      </div>
    </div>
  )
}
