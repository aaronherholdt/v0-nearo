import type { ReactNode } from "react"
import AppIconNav from "@/components/app-icon-nav"
import { cn } from "@/lib/utils"

interface IconPageShellProps {
  children: ReactNode
  contentClassName?: string
  outerClassName?: string
}

export default function IconPageShell({
  children,
  contentClassName,
  outerClassName,
}: IconPageShellProps) {
  return (
    <div
      className={cn(
        "flex min-h-[calc(100vh-var(--app-header-height,4rem))] bg-background md:h-[calc(100vh-var(--app-header-height,4rem))]",
        outerClassName
      )}
    >
      <AppIconNav />
      <div className={cn("flex-1 overflow-x-hidden", contentClassName)}>{children}</div>
    </div>
  )
}

