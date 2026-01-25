import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPostAuthRedirectPath } from '@/lib/auth/redirects'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code') // Supabase v2 sends ?code=...
  const next = url.searchParams.get('next')
  const flow = url.searchParams.get('flow')
  const supabase = await createClient()

  if (code) {
    // Exchanges the code in the URL for a session and sets auth cookies
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      // If it's an old/used link, show a friendly error
      return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent(error.message)}`, req.url))
    }
    const fallback = flow === 'signup' ? '/setup-profile' : '/forum'
    const derivedDestination = await getPostAuthRedirectPath(supabase)
    const destination = next ?? (derivedDestination === '/auth/login' ? fallback : derivedDestination)
    return NextResponse.redirect(new URL(destination, req.url))
  }

  // Hash-style errors (older links) come in as #error=... on the client.
  // Without a code we just send to login.
  return NextResponse.redirect(new URL('/auth/login?error=Missing+code', req.url))
}
