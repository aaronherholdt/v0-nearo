"use client"

import * as React from "react"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "./button"
import { useIsMobile } from "@/hooks/use-mobile"

interface MobileBackButtonProps {
  fallbackHref?: string
  label?: string
}

export function MobileBackButton({ fallbackHref = "/", label = "Back" }: MobileBackButtonProps) {
  const isMobile = useIsMobile()
  const router = useRouter()

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
    } else if (fallbackHref) {
      router.push(fallbackHref)
    }
  }
  
  if (!isMobile) return null
  
  return (
    <div className="md:hidden mb-4">
      <Button variant="ghost" size="sm" className="gap-2 -ml-2" onClick={handleBack}>
        <ArrowLeft className="h-4 w-4" /> {label}
      </Button>
    </div>
  )
}
