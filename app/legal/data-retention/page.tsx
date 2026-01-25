import { ShieldCheck, MapPin } from "lucide-react";
import Link from "next/link";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import LandingNav from "@/components/landing-nav";

export const metadata = {
  title: "Data & Retention | Nearo",
  description:
    "Plain-English data, privacy, and retention policy for families. Minimal collection, strong controls, no background location tracking.",
};

export default function DataRetentionPage() {
  const lastReviewed = "21 Oct 2025";

  return (
    <>
      <LandingNav />
      <div className="mx-auto max-w-3xl p-4 sm:p-8 pt-20 sm:pt-24">

      <div className="space-y-2 mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs">
          <ShieldCheck className="h-4 w-4" />
          Data & Privacy
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Data & Retention (Plain-English)</h1>
        <p className="text-muted-foreground max-w-2xl">
          We collect only what’s needed to keep families safe and make meetups work. This page explains what we store,
          for how long, and your choices. <strong>This is an MVP policy, not legal advice.</strong>
        </p>
        <p className="text-sm text-muted-foreground">Last reviewed: {lastReviewed}</p>
      </div>

      <div className="mb-6 rounded-xl border p-4">
        <h3 className="font-medium mb-2 flex items-center gap-2"><MapPin className="h-4 w-4" /> Location at a glance</h3>
        <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
          <li>Nearo does <strong>not</strong> track your device in the background.</li>
          <li>We show <strong>city/region</strong> by default; never your exact home address.</li>
          <li>Precise location is optional and only used during check-in you start.</li>
        </ul>
      </div>

      <div className="mb-6 rounded-xl border p-4">
        <h3 className="font-medium mb-2">Kids’ privacy at a glance</h3>
        <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
          <li>Children’s names are <strong>optional</strong> and kept <strong>private</strong>. They are never shown on profiles.</li>
          <li>Birthdates are stored privately to keep ages accurate and are <strong>never displayed</strong>.</li>
          <li>Other families can see only <strong>age</strong> (and optionally gender) for better matching.</li>
        </ul>
      </div>

      <Accordion type="single" collapsible className="w-full mb-6">
        <AccordionItem value="what-we-collect">
          <AccordionTrigger>What we collect and why</AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc pl-6 space-y-2 pt-2 text-sm text-muted-foreground">
              <li><strong>Guardian contact</strong> (name, email): sign-in, notifications.</li>
              <li><strong>Children’s details</strong> (optional first names/initials and birthdates stored privately): to compute current age accurately for matching. Only age (and optionally gender) may be shown.</li>
              <li><strong>Emergency contact</strong> (optional): available to hosts at check-in only.</li>
              <li><strong>Meetup check-ins</strong>: hashed 6-digit code + timestamps (trust & audit trail).</li>
              <li><strong>Reports & moderation</strong>: report reason/details and actions taken (community safety).</li>
              <li><strong>Security logs</strong>: login attempts and rate-limit data (fraud prevention).</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="what-we-dont">
          <AccordionTrigger>What we don’t collect</AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc pl-6 space-y-2 pt-2 text-sm text-muted-foreground">
              <li>Exact home addresses.</li>
              <li>Raw check-in codes (we store hashes and outcomes).</li>
              <li>Continuous/background location data.</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="kids-handling">
          <AccordionTrigger>How we handle kids’ information</AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground">
            We keep children’s names and birthdates private in our database so we can automatically calculate current ages
            (including as years change). We never display names or birthdates on profiles or in search. You may use initials or
            leave names blank. You can edit or remove this information any time in your profile settings.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="retention">
          <AccordionTrigger>How long we keep things (retention schedule)</AccordionTrigger>
          <AccordionContent className="pt-2 text-sm text-muted-foreground">
            <div className="space-y-4">
              <div className="border rounded-md p-3">
                <p className="font-medium">Account basics</p>
                <p>Retained while your account is active. Deleted on account deletion.</p>
              </div>
              <div className="border rounded-md p-3">
                <p className="font-medium">Children’s profile details</p>
                <p>Retained while your account is active to keep ages accurate. You can edit or remove them any time; deleted on account deletion.</p>
              </div>
              <div className="border rounded-md p-3">
                <p className="font-medium">Emergency contact</p>
                <p>Kept until you remove it or delete your account.</p>
              </div>
              <div className="border rounded-md p-3">
                <p className="font-medium">Meetup check-in logs</p>
                <p>6 months.</p>
              </div>
              <div className="border rounded-md p-3">
                <p className="font-medium">Reports & moderation</p>
                <p>12 months after case closure.</p>
              </div>
              <div className="border rounded-md p-3">
                <p className="font-medium">Security logs</p>
                <p>90 days.</p>
              </div>
              <div className="border rounded-md p-3">
                <p className="font-medium">Backups</p>
                <p>Rolling 30–90 days for disaster recovery.</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="controls">
          <AccordionTrigger>Your choices & rights</AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground">
            Download your data, delete your account, or change privacy settings any time in Settings. You can also remove children’s names or
            birthdates at any time. If you need help, {""}
            <Link href="/contact" className="text-primary underline">contact support</Link>. Regional rights (GDPR/POPIA/CCPA) apply.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="changes">
          <AccordionTrigger>Policy changes</AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground">
            We’ll update this page and notify you in-app or by email if the changes are significant.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      </div>
    </>
  );
}
