import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import LandingNav from "@/components/landing-nav";

export const metadata = {
  title: "FAQs | Nearo",
  description:
    "Parents' frequently asked questions about Nearo: location privacy, meetups, reporting, hubs, and sign-in safety.",
};

export default function FaqPage() {
  const lastUpdated = "26 Sep 2025";
  return (
    <>
      <LandingNav />
      <div className="mx-auto max-w-3xl p-4 sm:p-8 pt-20 sm:pt-24">
      <div className="space-y-2 mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs">
          <HelpCircle className="h-4 w-4" /> FAQs
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Frequently asked questions</h1>
        <p className="text-sm text-muted-foreground">Updated: {lastUpdated}</p>
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="track">
          <AccordionTrigger>Does Nearo track my location constantly?</AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground">
            No. Nearo does <strong>not</strong> run background tracking. By default we show only your
            city/region for matching. You can optionally share precise location when you check in for a meetup.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="how">
          <AccordionTrigger>How does Nearo work if I've never used Tinder?</AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground">
            Think "family meetups," not dating. Browse nearby families (city-level), chat, and if you both agree,
            meet in a public place. At the meetup, both guardians enter a one-time 6-digit code to confirm the visit.
          </AccordionContent>
        </AccordionItem>


        <AccordionItem value="kids">
          <AccordionTrigger>Can I hide my children's details?</AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground">
            Yes. Nearo never shows full names or birthdays—only age ranges. You choose what to share in photos and bio.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="meetup">
          <AccordionTrigger>What happens during a meetup?</AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground">
            Meet in a public, child-friendly place. Exchange the in-app check-in code. If either family doesn't feel
            comfortable, you can leave at any time and block/report from the profile.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="hub">
          <AccordionTrigger>Can I use Nearo without joining a hub?</AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground">
            Absolutely. Hubs are optional groups. You can connect one-to-one with nearby families anytime.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="google">
          <AccordionTrigger>Why did Google sign-in show a strange string of letters?</AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground">
            Your Google consent screen should say <strong>Nearo</strong> and our domain (e.g., <em>nearo.forum</em>).
            If you ever see a different app name or a random URL, stop and contact support from the sign-in screen.
            We use Google OAuth securely; occasionally a browser cache or older configuration can display an outdated name.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="data">
          <AccordionTrigger>What data do you collect?</AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground">
            Only what's needed: guardian contact, emergency contact, security logs,
            and meetup check-ins (hashed codes). See the{" "}
            <Link className="text-primary underline" href="/data-retention">Data & Retention policy</Link> for details.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="delete">
          <AccordionTrigger>How do I download or delete my data?</AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground">
            From settings you can request an export or delete your account. Or{" "}
            <Link className="text-primary underline" href="/contact">contact support</Link> and we'll help.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="report">
          <AccordionTrigger>What if something feels off?</AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground">
            End the meetup or chat, block the user, and file a report. We review quickly. In an emergency, call local authorities.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      </div>
    </>
  );
}
