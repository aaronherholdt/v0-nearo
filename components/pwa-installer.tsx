'use client'

import { useEffect, useMemo, useState } from 'react'

declare global {
  interface WindowEventMap { beforeinstallprompt: any }
}

export default function PwaInstaller() {
  const [deferred, setDeferred] = useState<any>(null)
  const [showInstall, setShowInstall] = useState(false)
  const [notifReady, setNotifReady] = useState(
    typeof Notification !== 'undefined' ? Notification.permission === 'granted' : true
  )
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem('nearo-banner-dismissed')
    if (stored === '1') setDismissed(true)
  }, [])

  const isStandalone = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone
  }, [])

  const isIOS = useMemo(() => {
    if (typeof navigator === 'undefined') return false
    return /iphone|ipad|ipod/i.test(navigator.userAgent)
  }, [])

  useEffect(() => {
    // Register your existing SW (keeps Android install + push working)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' }).catch(() => {})
    }

    // Android/desktop: capture install prompt
    const onBIP = (e: any) => {
      e.preventDefault()
      setDeferred(e)
      setShowInstall(true)
    }
    window.addEventListener('beforeinstallprompt', onBIP)

    const onInstalled = () => {
      setShowInstall(false)
      setDeferred(null)
    }
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBIP)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function handleInstall() {
    if (!deferred) return
    deferred.prompt()
    await deferred.userChoice
    setShowInstall(false)
    setDeferred(null)
  }

  async function enableNotifications() {
    if (typeof Notification === 'undefined') return
    const perm = await Notification.requestPermission()
    if (perm === 'granted') setNotifReady(true)
    // Android/Desktop: your existing FCM token logic can run elsewhere as you already set up
    // iOS note: see Step 4 if you want web-push on iOS now
  }

  function handleDismiss() {
    setDismissed(true)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('nearo-banner-dismissed', '1')
    }
  }

  // --- iOS install helper (shown only in Safari when not standalone) ---
  const showIOSHelp = isIOS && !isStandalone

  // Hide everything if nothing to show
  if (dismissed || (!showInstall && !showIOSHelp && notifReady)) return null

  return (
    <div className="fixed bottom-4 inset-x-0 z-50 flex md:hidden justify-center px-3">
      <div className="relative flex items-center gap-3 rounded-xl border bg-white px-4 pr-12 py-3 shadow-lg max-w-[680px] w-full">
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss install banner"
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-100"
        >
          <span aria-hidden="true">X</span>
          <span className="sr-only">Close</span>
        </button>

        {showIOSHelp && (
          <div className="flex items-center justify-between w-full gap-3">
            <div className="text-sm">
              <div className="font-medium">Add Nearo to your Home Screen</div>
              <div>Tap <span className="font-semibold">Share</span> → <span className="font-semibold">Add to Home Screen</span></div>
            </div>
          </div>
        )}

        {!showIOSHelp && showInstall && (
          <>
            <span className="text-sm">Install Nearo for quick access</span>
            <button onClick={handleInstall} className="rounded-lg bg-black px-3 py-1 text-sm text-white">
              Install
            </button>
          </>
        )}

        {!notifReady && !showIOSHelp && (
          <>
            <span className="text-sm">Enable notifications?</span>
            <button onClick={enableNotifications} className="rounded-lg bg-emerald-600 px-3 py-1 text-sm text-white">
              Allow
            </button>
          </>
        )}
      </div>
    </div>
  )
}
