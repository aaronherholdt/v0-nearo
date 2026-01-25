// app/page.tsx
export const metadata = {
  alternates: { canonical: '/' },
  title: 'Nearo - Meet Families Nearby & When Travelling',
  description:
    'Find families near you or while you\'re travelling. Discover meetups and kid-friendly trips, connect safely, and build real-world adventures with Nearo.',
  openGraph: {
    url: 'https://nearo.forum/',
    title: 'Nearo - Meet Families Nearby & When Travelling',
    description:
      'Find families near you or while you\'re travelling. Discover meetups and kid-friendly trips, connect safely, and build real-world adventures with Nearo.',
  },
}

import LandingPage from "@/components/landing-page"

export default function Home() {
  return <LandingPage />
}