"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import AppIconNav from "@/components/app-icon-nav"
import ChatListPane from "./components/chat-list-pane"

export default function ChatLandingPage() {
  return (
    <div className="flex min-h-[calc(100vh-var(--app-header-height,4rem))] bg-background md:h-[calc(100vh-var(--app-header-height,4rem))]">
      <AppIconNav />
      <div className="flex min-h-[calc(100vh-var(--app-header-height,4rem))] w-full flex-col md:h-[calc(100vh-var(--app-header-height,4rem))] md:min-h-0 md:flex-row md:overflow-hidden">
        <div className="flex flex-col border-b border-border md:h-full md:min-h-0 md:w-[340px] md:border-b-0 md:border-r">
          <ChatListPane />
        </div>
        <div className="flex flex-1 min-h-0 items-center justify-center bg-muted/30 px-6 py-16">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-semibold md:text-3xl">Select a message</h1>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              Choose from your existing conversations, start a new one, or just keep swimming.
            </p>
            <div className="mt-8">
              <Link href="/families">
                <Button className="rounded-full bg-emerald-600 px-6 text-white hover:bg-emerald-700">
                  New message
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
