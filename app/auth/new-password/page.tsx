'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@/lib/supabase/client'

export default function NewPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    if (password.length < 8) return setErr('Use at least 8 characters.')
    if (password !== confirm) return setErr('Passwords do not match.')
    setSaving(true)

    const { error } = await supabase.auth.updateUser({ password })
    setSaving(false)
    if (error) setErr(error.message)
    else router.push('/dashboard')
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-6 text-2xl font-semibold">Create a new password</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border px-3 py-2"
        />
        <input
          type="password"
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-md border px-3 py-2"
        />
        <button
          disabled={saving}
          className="w-full rounded-md bg-emerald-600 px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save password'}
        </button>
        {err && <p className="text-sm text-red-600">{err}</p>}
      </form>
    </div>
  )
}

