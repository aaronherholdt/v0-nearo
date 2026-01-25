import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Script from "next/script"
import { createClient } from "@/lib/supabase/server"
import SimpleNav from "@/components/simple-nav"
import PwaInstaller from "@/components/pwa-installer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL('https://nearo.forum'),
  title: {
    default: 'Nearo - Meet Families Nearby & When Travelling',
    template: '%s · Nearo',
  },
  description:
    'Discover like-minded families near you or on the road. Plan kid-friendly trips and meetups, message safely, and build real-world adventures with Nearo.',
  manifest: "/manifest.json",
  openGraph: {
    type: 'website',
    url: 'https://nearo.forum/',
    siteName: 'Nearo',
    title: 'Nearo - Meet Families Nearby & When Travelling',
    description:
      'Discover like-minded families near you or on the road. Plan kid-friendly trips and meetups, message safely, and build real-world adventures with Nearo.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nearo - Meet Families Nearby & When Travelling',
    description:
      'Discover like-minded families near you or on the road. Plan kid-friendly trips and meetups, message safely, and build real-world adventures with Nearo.',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <html lang="en">
      <head>
        {/* Helps Android tint the address bar to match your PWA */}
        <meta name="theme-color" content="#059669" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <Script
          defer
          data-website-id="dfid_0N4CqIkNoYWj0yQmW5buJ"
          data-domain="nearo.forum"
          src="https://datafa.st/js/script.js"
        />
      </head>
      <Script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js" />
      <Script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <SimpleNav user={user} />
        <main>{children}</main>
        <PwaInstaller />
      </body>
    </html>
  )
}