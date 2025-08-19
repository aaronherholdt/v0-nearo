"use client";

import React from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function SafetyFAQ() {
  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-8">
      {/* Return Button */}
      <div className="mb-6">
        <Link href="/safety" className="inline-flex items-center cursor-pointer">
          <Button variant="outline" size="sm" className="gap-2 cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
            Return to Safety Center
          </Button>
        </Link>
      </div>
      
      {/* Header */}
      <div className="space-y-2 mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs cursor-pointer">
          <ShieldCheck className="h-4 w-4" />
          Safety Center
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Safety FAQs</h1>
        <p className="text-muted-foreground max-w-2xl">
          Answers to common questions about our safety features and policies.
        </p>
      </div>

      {/* FAQ Accordion */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>Who can see my family's data?</AccordionTrigger>
          <AccordionContent>
            <p className="mb-2">We limit visibility based on what's necessary for safety and connection:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Public profile:</strong> Only what you choose to share (family composition, interests, city-level location)</li>
              <li><strong>Child information:</strong> Only age ranges by default; names are optional and can be hidden</li>
              <li><strong>Contact details:</strong> Only shared with matched families after both parties agree</li>
              <li><strong>Emergency contacts:</strong> Only visible to event hosts during active check-ins</li>
              <li><strong>Verification status:</strong> Badge visible on profiles, but verification details are private</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger>Do you track my exact location?</AccordionTrigger>
          <AccordionContent>
            <p className="mb-2">No, we prioritize location privacy:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>By default, only city-level location is shown on profiles</li>
              <li>Precise location is only used during active check-ins at events (optional feature)</li>
              <li>You can enable "Location guard" in settings to always limit to city-level only</li>
              <li>We never track location in the background</li>
              <li>Location data from check-ins is deleted 30 days after the event</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger>How does the check-in system work?</AccordionTrigger>
          <AccordionContent>
            <p className="mb-2">Our check-in system verifies real meetups:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Host PIN:</strong> Event hosts receive a unique 6-digit code</li>
              <li><strong>Attendee verification:</strong> Attendees enter this code when they arrive</li>
              <li><strong>Location-based (optional):</strong> Uses your device location to confirm you're at the event</li>
              <li><strong>Emergency contacts:</strong> Hosts can see emergency contacts only after check-in</li>
              <li><strong>Safety notifications:</strong> Trusted contacts can receive automated check-in/out alerts</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-4">
          <AccordionTrigger>What is the ID verification process?</AccordionTrigger>
          <AccordionContent>
            <p className="mb-2">Our verification process is secure and privacy-focused:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Upload a government ID and take a quick selfie</li>
              <li>A third-party verification service matches your selfie to your ID</li>
              <li>We only receive a pass/fail result and timestamp</li>
              <li>Your actual ID images and selfie are not stored on our servers</li>
              <li>Verification is required for hosting events and recommended for all users</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-5">
          <AccordionTrigger>How do I report someone?</AccordionTrigger>
          <AccordionContent>
            <p className="mb-2">You can report concerns through multiple channels:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Profile reports:</strong> Available on every user profile</li>
              <li><strong>Event reports:</strong> Available on event pages</li>
              <li><strong>Message reports:</strong> Flag inappropriate messages</li>
              <li><strong>Urgent reports:</strong> Marked urgent reports are reviewed within hours</li>
              <li><strong>Block function:</strong> Immediately prevents further contact</li>
            </ul>
            <p className="mt-2">For immediate safety concerns, always contact local authorities first.</p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-6">
          <AccordionTrigger>What safety tips do you recommend for first meetings?</AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc pl-6 space-y-1">
              <li>Meet in public, family-friendly places for the first 2-3 meetups</li>
              <li>Share event details with a trusted friend or family member</li>
              <li>Use the check-in feature to verify your meetup</li>
              <li>Keep conversations on the platform until you're comfortable</li>
              <li>Trust your instincts—if something feels off, it's okay to cancel</li>
              <li>Have an exit plan and transportation arranged</li>
              <li>Keep emergency contacts and numbers accessible</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-7">
          <AccordionTrigger>How are messages protected?</AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc pl-6 space-y-1">
              <li>All messages are encrypted in transit and at rest</li>
              <li>Message history is only visible to conversation participants</li>
              <li>You can delete messages at any time</li>
              <li>Automated systems scan for prohibited content (without human review)</li>
              <li>Message reporting allows our team to review specific conversations if needed</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-8">
          <AccordionTrigger>Can I delete my data?</AccordionTrigger>
          <AccordionContent>
            <p className="mb-2">Yes, you have full control over your data:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Delete specific content (messages, events, photos) at any time</li>
              <li>Request complete account deletion through settings</li>
              <li>Account deletion removes all your data from active systems</li>
              <li>Backup data is purged within 30 days</li>
              <li>Some minimal records may be retained for legal compliance</li>
            </ul>
            <p className="mt-2">For specific data concerns, contact privacy@familyconnect.example.com</p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Help Section */}
      <div className="mt-10 p-4 border rounded-lg bg-muted/50">
        <h2 className="text-lg font-medium mb-2">Need more help?</h2>
        <p className="text-sm text-muted-foreground mb-4">
          If you have additional questions or concerns about safety features, please contact our support team.
        </p>
        <Button className="w-full sm:w-auto">Contact Support</Button>
      </div>
    </div>
  );
}
