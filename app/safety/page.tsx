"use client";
import React from "react";
import { ShieldCheck, CheckCircle2, Circle, ArrowRight, ExternalLink, Phone, MapPin, FileCheck, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";

// ---- Props you can wire to real data later ----
// safetyState example shape
// {
//   checklist: {
//     idCheck: "done" | "pending",
//     meetingTips: "pending" | "done",
//     checkIn: "pending" | "done"
//   },
//   verifiedBadge: boolean,
//   phoneVerified: boolean,
//   emailVerified: boolean,
//   emergencyContactSet: boolean
// }

const mockSafetyState = {
  checklist: {
    idCheck: "pending",
    meetingTips: "pending",
    checkIn: "pending",
  },
  verifiedBadge: false,
  phoneVerified: true,
  emailVerified: true,
  emergencyContactSet: false,
};

function StatusDot({ done }: { done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {done ? (
        <CheckCircle2 className="h-5 w-5" aria-hidden />
      ) : (
        <Circle className="h-5 w-5" aria-hidden />
      )}
    </div>
  );
}

function ChecklistRow({
  title,
  description,
  done = false,
  cta,
  onClick,
  external = false,
}: {
  title: string;
  description?: string;
  done?: boolean;
  cta: string;
  onClick?: () => void;
  external?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex items-start gap-3">
        <StatusDot done={done} />
        <div>
          <p className={`font-medium ${done ? "line-through text-muted-foreground" : ""}`}>{title}</p>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>
      <div className="shrink-0">
        <Button variant={done ? "secondary" : "default"} onClick={onClick} disabled={done} className="cursor-pointer">
          {cta} {external && <ExternalLink className="ml-2 h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

export default function SafetyCenter() {
  const state = mockSafetyState; // replace with real data via props or loader
  const completedCount = [
    state.checklist.idCheck,
    state.checklist.meetingTips,
    state.checklist.checkIn,
  ].filter((s) => s === "done").length;
  const progress = Math.round((completedCount / 3) * 100);

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-8">
      {/* Return to Dashboard Button */}
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center cursor-pointer">
          <Button variant="outline" size="sm" className="gap-2 cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
            Return to Dashboard
          </Button>
        </Link>
      </div>
      
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs cursor-pointer">
            <ShieldCheck className="h-4 w-4" />
            Safety Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Your family's safety comes first</h1>
          <p className="text-muted-foreground max-w-2xl">
            Complete the checklist to earn a <span className="font-medium">Verified</span> badge and unlock
            hosting and messaging features. We only store what's necessary—your privacy stays in your control.
          </p>
        </div>
        <div className="text-right">
          {state.verifiedBadge ? (
            <Badge className="text-sm">Verified</Badge>
          ) : (
            <Badge variant="secondary" className="text-sm">Unverified</Badge>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Checklist Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Safety Checklist <span className="text-muted-foreground text-sm">({completedCount}/3)</span></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Safety Progress</span>
                <span>{progress}% complete</span>
              </div>
              <Progress value={progress} />
            </div>

            <div className="divide-y">
              <ChecklistRow
                title="Complete guardian ID check (Mom & Dad)"
                description="Upload an ID/passport and a quick selfie for a match. We don't store images—only a pass/fail token."
                done={state.checklist.idCheck === "done"}
                cta={state.checklist.idCheck === "done" ? "Done" : "Start ID check"}
                onClick={() => console.log("start id flow")}
                external
              />
              <ChecklistRow
                title="Read meeting safety tips"
                description="Best practices for first meetups, public places, and check-ins."
                done={state.checklist.meetingTips === "done"}
                cta={state.checklist.meetingTips === "done" ? "Done" : "Read tips"}
                onClick={() => console.log("open tips")}
              />
              <ChecklistRow
                title="Enable event check‑in"
                description="Turn on location‑based check‑in for meetups or use host PIN codes."
                done={state.checklist.checkIn === "done"}
                cta={state.checklist.checkIn === "done" ? "Done" : "Enable"}
                onClick={() => console.log("enable checkin")}
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="secondary" className="gap-2 cursor-pointer">
                    <FileCheck className="h-4 w-4" /> View data & retention policy
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Data & Retention (Plain-English)</DialogTitle>
                    <DialogDescription className="pt-2">
                      • We store the minimum needed for safety.<br/>
                      • Check-in: only a hashed code + timestamp.<br/>
                      • Emergency contact: host sees it at check-in only.<br/>
                      • ID checks (if used): provider processes; we keep pass/fail + time.<br/>
                      • Deletion: you can request removal anytime. Backups purge on a schedule.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="justify-between">
                    <span className="text-xs text-muted-foreground">Last reviewed: {new Date().toLocaleDateString()}</span>
                    <Button asChild>
                      <Link href="/legal/data-retention">Read full policy</Link>
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="secondary" className="gap-2 cursor-pointer">
                    <ExternalLink className="h-4 w-4" /> Safety FAQs
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Safety FAQs</DialogTitle>
                    <DialogDescription className="pt-2">
                      • Who can see my data? Only what's needed for safety.<br/>
                      • Do you track my exact location? No—city level by default; optional check-in radius at events.<br/>
                      • What proves a real meetup? A one-time 6-digit code checked by the host.<br/>
                      • How do I report someone? Report/Block on any profile or event.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button asChild>
                      <Link href="/safety/faq">Open full FAQs</Link>
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Quick Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Safety Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Phone verified</p>
                <p className="text-sm text-muted-foreground">Required for messaging.</p>
              </div>
              <Badge variant={state.phoneVerified ? "default" : "secondary"}>
                {state.phoneVerified ? "Verified" : "Pending"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email verified</p>
                <p className="text-sm text-muted-foreground">Sign-in alerts enabled.</p>
              </div>
              <Badge variant={state.emailVerified ? "default" : "secondary"}>
                {state.emailVerified ? "Verified" : "Pending"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Emergency contact</p>
                <p className="text-sm text-muted-foreground">Share with hosts at check‑in.</p>
              </div>
              <Button variant="outline" size="sm" className="cursor-pointer">{state.emergencyContactSet ? "Edit" : "Add"}</Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Hide child names</p>
                <p className="text-sm text-muted-foreground">Show age ranges only on profile.</p>
              </div>
              <Switch className="cursor-pointer" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Location guard</p>
                <p className="text-sm text-muted-foreground">Only show city‑level location.</p>
              </div>
              <Switch className="cursor-pointer" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Meeting Tips */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>First‑Meeting Safety Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5" />
              <p>Meet in a public, family‑friendly place for the first 2–3 meetups. Share the event with a trusted friend.</p>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5" />
              <p>Enable check‑in and share your live location with the host during the event. Keep emergency numbers handy.</p>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5" />
              <p>Only verified guardians can host. Report suspicious behaviour immediately from any profile or event.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Need help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="border rounded-xl p-3">
              <p className="font-medium">Report or Block</p>
              <p className="text-muted-foreground">Available on every profile and event. Our team reviews urgent reports within hours.</p>
              <Button className="mt-3 w-full cursor-pointer" variant="secondary">Open Safety Center Inbox</Button>
            </div>
            <div className="border rounded-xl p-3">
              <p className="font-medium">Emergency</p>
              <p className="text-muted-foreground">If you feel unsafe, leave and contact local authorities first.</p>
              <Button className="mt-3 w-full cursor-pointer" variant="destructive">View emergency numbers</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-10 text-center text-xs text-muted-foreground">
        By using this feature you agree to our Community Guidelines and Data & Retention Policy.
      </div>
    </div>
  );
}
