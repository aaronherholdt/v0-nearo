'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle'|'sending'|'sent'|'error'>('idle')
  const [err, setErr] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending'); setErr(null)

    const origin = window.location.origin
    // After the user clicks the email link, we land on /auth/callback,
    // exchange the code for a session, then redirect to /auth/new-password.
    const redirectTo = `${origin}/auth/callback?next=/auth/new-password`

    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    if (error) { setErr(error.message); setStatus('error') }
    else { setStatus('sent') }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-6 text-2xl font-semibold">Reset your password</h1>
      {status === 'sent' ? (
        <p>Check <b>{email}</b> for a link to reset your password.</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-md border px-3 py-2"
          />
          <button
            disabled={status === 'sending'}
            className="w-full rounded-md bg-emerald-600 px-4 py-2 font-medium text-white disabled:opacity-60"
          >
            {status === 'sending' ? 'Sending…' : 'Send reset link'}
          </button>
          {err && <p className="text-sm text-red-600">{err}</p>}
        </form>
      )}

      <button onClick={() => router.push('/auth/login')} className="mt-6 text-sm underline hover:text-emerald-600 cursor-pointer">
        Back to login
      </button>
    </div>
  )
}

