import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata = {
  title: "Data & Retention Policy | Homeschool Families",
  description:
    "Plain‑English data, privacy, and retention policy for the Safety Center. Low‑friction, high‑trust.",
};

export default function DataRetentionPage() {
  const lastReviewed = "19 Aug 2025"; // update when policies change
  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-8">
      {/* Return Button */}
      <div className="mb-6">
        <a href="/safety" className="inline-flex items-center cursor-pointer">
          <Button variant="outline" size="sm" className="gap-2 cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
            Back to Safety Center
          </Button>
        </a>
      </div>
      
      {/* Header */}
      <div className="space-y-2 mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs cursor-pointer">
          <ShieldCheck className="h-4 w-4" />
          Data & Privacy
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Data & Retention Policy (Plain‑English)</h1>
        <p className="text-muted-foreground max-w-2xl">
          We collect only what's needed to keep families safe and make meetups work. This page explains
          what we store, for how long, and the choices you control. <strong>This is an MVP document and
          not legal advice.</strong>
        </p>
        <p className="text-sm text-muted-foreground">Last reviewed: {lastReviewed}</p>
      </div>

      {/* What we collect section */}
      <Accordion type="single" collapsible className="w-full mb-6">
        <AccordionItem value="item-1">
          <AccordionTrigger>What we collect and why</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <div>
                <p className="font-medium">Account basics</p>
                <p className="text-muted-foreground">Guardian name, email, phone: to sign in, verify you're a real person, and communicate about meetups.</p>
              </div>
              
              <div>
                <p className="font-medium">Emergency contact</p>
                <p className="text-muted-foreground">Name + phone: shared with the host only at check‑in, to reach someone quickly in an emergency.</p>
              </div>
              
              <div>
                <p className="font-medium">Meetup check‑ins</p>
                <p className="text-muted-foreground">A one‑time <em>hashed</em> 6‑digit code, success/failure, and a timestamp. Used to confirm "Met in real life ✅" and unlock follow‑up chat.</p>
              </div>
              
              <div>
                <p className="font-medium">Reports & moderation</p>
                <p className="text-muted-foreground">Report reason, free‑text details, timestamps, and our actions (e.g., warnings, restrictions). Used to keep the community safe.</p>
              </div>
              
              <div>
                <p className="font-medium">Optional Guardian ID verification</p>
                <p className="text-muted-foreground">Processed by a trusted provider. We store only <em>pass/fail</em>, document type (e.g., passport), issuing country, and verification time. <em>We do not store ID images.</em></p>
              </div>
              
              <div>
                <p className="font-medium">Security logs</p>
                <p className="text-muted-foreground">Login attempts, OTP sends, limited device/network metadata. Used for fraud prevention and abuse rate‑limiting.</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-2">
          <AccordionTrigger>What we don't collect</AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc pl-6 space-y-2 pt-2">
              <li><strong>Exact home addresses</strong> - We show city‑level location by default.</li>
              <li><strong>Children's full names</strong> - We show age ranges only.</li>
              <li><strong>Raw meetup codes or verification images</strong> - We store <em>hashes</em> and <em>pass/fail</em> results only.</li>
              <li><strong>Continuous background location</strong> - We never track location in the background.</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-3">
          <AccordionTrigger>How long we keep things (retention schedule)</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <div className="border rounded-md p-3">
                <p className="font-medium">Account basics</p>
                <div className="text-sm text-muted-foreground mt-1">
                  <p><strong>Data:</strong> Email, phone, guardian name</p>
                  <p><strong>Purpose:</strong> Sign‑in, messaging, notifications</p>
                  <p className="mt-2"><strong>Retention period:</strong> For the life of the account (deleted on account deletion)</p>
                </div>
              </div>
              
              <div className="border rounded-md p-3">
                <p className="font-medium">Emergency contact</p>
                <div className="text-sm text-muted-foreground mt-1">
                  <p><strong>Data:</strong> Name and phone number</p>
                  <p><strong>Purpose:</strong> Shared with host at check‑in only</p>
                  <p className="mt-2"><strong>Retention period:</strong> Until you remove it or delete your account</p>
                </div>
              </div>
              
              <div className="border rounded-md p-3">
                <p className="font-medium">Meetup check‑in logs</p>
                <div className="text-sm text-muted-foreground mt-1">
                  <p><strong>Data:</strong> Hashed code + timestamps</p>
                  <p><strong>Purpose:</strong> Trust signals, audit trail</p>
                  <p className="mt-2"><strong>Retention period:</strong> 6 months</p>
                </div>
              </div>
              
              <div className="border rounded-md p-3">
                <p className="font-medium">Reports & moderation actions</p>
                <div className="text-sm text-muted-foreground mt-1">
                  <p><strong>Data:</strong> Report details and actions taken</p>
                  <p><strong>Purpose:</strong> Community safety and appeals</p>
                  <p className="mt-2"><strong>Retention period:</strong> 12 months after closure of a case</p>
                </div>
              </div>
              
              <div className="border rounded-md p-3">
                <p className="font-medium">Guardian ID verification result</p>
                <div className="text-sm text-muted-foreground mt-1">
                  <p><strong>Data:</strong> Pass/fail + metadata</p>
                  <p><strong>Purpose:</strong> Show "Verified" badge; enable hosting</p>
                  <p className="mt-2"><strong>Retention period:</strong> Kept while account is active; no images stored</p>
                </div>
              </div>
              
              <div className="border rounded-md p-3">
                <p className="font-medium">Manual ID uploads (MVP fallback only)</p>
                <div className="text-sm text-muted-foreground mt-1">
                  <p><strong>Data:</strong> ID documents</p>
                  <p><strong>Purpose:</strong> Manual review if provider is unavailable</p>
                  <p className="mt-2"><strong>Retention period:</strong> Auto‑deleted within 14 days of decision</p>
                </div>
              </div>
              
              <div className="border rounded-md p-3">
                <p className="font-medium">Security logs</p>
                <div className="text-sm text-muted-foreground mt-1">
                  <p><strong>Data:</strong> Login attempts, OTP, rate limit</p>
                  <p><strong>Purpose:</strong> Fraud and abuse prevention</p>
                  <p className="mt-2"><strong>Retention period:</strong> 90 days</p>
                </div>
              </div>
              
              <div className="border rounded-md p-3">
                <p className="font-medium">Backups</p>
                <div className="text-sm text-muted-foreground mt-1">
                  <p><strong>Data:</strong> All system data</p>
                  <p><strong>Purpose:</strong> Disaster recovery only</p>
                  <p className="mt-2"><strong>Retention period:</strong> Rolling 30–90 days; purged during deletion cycles</p>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-4">
          <AccordionTrigger>Where we store data & security measures</AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc pl-6 space-y-2 pt-2">
              <li><strong>Encryption</strong> - Data is encrypted in transit (TLS) and at rest.</li>
              <li><strong>Access controls</strong> - Principle of least privilege for staff access; admin 2FA required.</li>
              <li><strong>Rate limiting</strong> - Rate‑limits on sensitive actions (OTP, check‑ins, reports).</li>
              <li><strong>Audit trails</strong> - Audit logs for verification, check‑ins, and moderation.</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-5">
          <AccordionTrigger>Your choices & controls</AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc pl-6 space-y-2 pt-2">
              <li><strong>Emergency contact management</strong> - Update or remove your emergency contact at any time.</li>
              <li><strong>Privacy settings</strong> - Toggle privacy settings (city‑level location, hide child names).</li>
              <li><strong>Data access & deletion</strong> - Request a copy of your data or deletion: <a href="/contact" className="text-primary underline">contact us</a>.</li>
              <li><strong>Feature opt-outs</strong> - Opt out of optional features like check‑in geofencing.</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-6">
          <AccordionTrigger>Children's data</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <div>
                <p className="font-medium">Platform usage</p>
                <p className="text-muted-foreground">Our platform is for guardians. Children should not create accounts or post content.</p>
              </div>
              
              <div>
                <p className="font-medium">Profile information</p>
                <p className="text-muted-foreground">Profiles may include age ranges for matching; never full names of minors.</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-7">
          <AccordionTrigger>Regional notes (GDPR/POPIA/CCPA)</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <div>
                <p className="font-medium">Legal bases</p>
                <p className="text-muted-foreground">Consent (e.g., check‑in), contract (to provide the service), and legitimate interests (security, fraud prevention).</p>
              </div>
              
              <div>
                <p className="font-medium">Your rights</p>
                <p className="text-muted-foreground">You may have rights to access, correct, delete, or restrict processing of your data. Use the controls above or <a href="/contact" className="text-primary underline">contact us</a>.</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-8">
          <AccordionTrigger>Changes to this policy</AccordionTrigger>
          <AccordionContent>
            <p className="text-muted-foreground pt-2">
              We will update this page when practices change and note the revised date. Significant changes will be communicated in‑app or by email.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Help Section */}
      <div className="mt-10 p-4 border rounded-lg bg-muted/50">
        <h2 className="text-lg font-medium mb-2">Questions?</h2>
        <p className="text-sm text-muted-foreground mb-4">
          If you have additional questions or concerns about our data practices, please contact our support team.
        </p>
        <Button asChild>
          <a href="/contact">Contact Support</a>
        </Button>
      </div>
    </div>
  );
}
