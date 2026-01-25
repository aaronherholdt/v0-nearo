import { ShieldCheck, MapPin, Users2, EyeOff, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { MobileBackButton } from "@/components/ui/mobile-back-button";
import LandingNav from "@/components/landing-nav";

export const metadata = {
  title: "Safety Center | Nearo",
  description:
    "How Nearo keeps traveling families safe. No background tracking, city-level location by default, reporting, and meet-in-public guidance.",
};

export default function SafetyPage() {
  const lastReviewed = "26 Sep 2025";

  return (
    <>
      <LandingNav />
      <div className="mx-auto max-w-4xl p-4 sm:p-8 pt-20 sm:pt-24 space-y-8">
      <MobileBackButton fallbackHref="/" />
      {/* Header */}
      <section className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs">
          <ShieldCheck className="h-4 w-4" />
          Safety & Privacy
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          Safety Center
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          We built Nearo for parents. You control what’s shared, when it’s shared, and who sees it.
          By default we show <strong>city-level</strong> location only. We never track you in the
          background. Full stop.
        </p>
        <p className="text-xs text-muted-foreground">Last reviewed: {lastReviewed}</p>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button asChild><Link href="/faq">Read FAQs</Link></Button>
          <Button variant="outline" asChild><Link href="/legal/data-retention">Data & Retention</Link></Button>
        </div>
      </section>

      {/* "At a glance" cards */}
      <section className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl border p-5 space-y-2">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <MapPin className="h-4 w-4" />
          </div>
          <h3 className="font-medium">No background tracking</h3>
          <p className="text-sm text-muted-foreground">
            Share your location only when you choose (e.g., check-in). Otherwise, Nearo only uses your
            city/region for matching.
          </p>
        </div>

        <div className="rounded-xl border p-5 space-y-2">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <EyeOff className="h-4 w-4" />
          </div>
          <h3 className="font-medium">Protecting children's info</h3>
          <p className="text-sm text-muted-foreground">
            No full names or birthdays. Only age ranges (e.g., "5–7") and non-identifying details.
          </p>
        </div>

        <div className="rounded-xl border p-5 space-y-2">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <Users2 className="h-4 w-4" />
          </div>
          <h3 className="font-medium">Real families, real connections</h3>
          <p className="text-sm text-muted-foreground">
            Profile reviews and one-time meetup check-in codes help build trust and ensure safe connections.
          </p>
        </div>

        <div className="rounded-xl border p-5 space-y-2">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <h3 className="font-medium">Block & report—fast</h3>
          <p className="text-sm text-muted-foreground">
            If anything feels off, block the user and report it. We review quickly. In an emergency, call your local authorities.
          </p>
        </div>
      </section>


      {/* Collapsible details */}
      <section>
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="loc">
            <AccordionTrigger>Location & privacy</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              - City/region is shown by default. <br />
              - You can temporarily share precise location for a meetup (optional). <br />
              - Nearo does <strong>not</strong> track your device in the background.
            </AccordionContent>
          </AccordionItem>


          <AccordionItem value="children">
            <AccordionTrigger>Children's data</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              Nearo is for guardians. Minors shouldn't own accounts. Profiles use age ranges only, never full names.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
      </div>
    </>
  );
}
