"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Loader2 } from "lucide-react"
import { sendMessage } from "@/lib/actions"

function SendButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending} className="bg-emerald-600 hover:bg-emerald-700">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
    </Button>
  )
}

interface MessageInputProps {
  matchId: string
  familyId: string
}

export default function MessageInput({ matchId, familyId }: MessageInputProps) {
  const [message, setMessage] = useState("")

  const handleSubmit = async (formData: FormData) => {
    const result = await sendMessage(formData)
    if (result?.success) {
      setMessage("")
    }
  }

  return (
    <form action={handleSubmit} className="flex space-x-2">
      <input type="hidden" name="match_id" value={matchId} />
      <input type="hidden" name="sender_family_id" value={familyId} />
      <Textarea
        name="content"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
        className="flex-1 min-h-[40px] max-h-[120px] resize-none"
        rows={1}
        required
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            const form = e.currentTarget.form
            if (form && message.trim()) {
              const formData = new FormData(form)
              handleSubmit(formData)
            }
          }
        }}
      />
      <SendButton />
    </form>
  )
}
