import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { createClient } from "@/lib/supabase/server"
import SimpleNav from "@/components/simple-nav"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "nearo - Connect with families during your travels",
  description: "Connect with other families while traveling with your kids",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <SimpleNav user={user} />
        <main>{children}</main>
      </body>
    </html>
  )
}