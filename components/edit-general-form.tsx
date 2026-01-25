"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { createClientComponentClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface EditGeneralFormProps {
  thread: any
}

export default function EditGeneralForm({ thread }: EditGeneralFormProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()

  const [title, setTitle] = useState(thread.title || "")
  const [body, setBody] = useState(thread.body || "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const trimmedTitle = title.trim()
    const trimmedBody = body.trim()

    if (!trimmedTitle || !trimmedBody) {
      toast.error("Title and description are required")
      return
    }

    try {
      setIsSubmitting(true)

      // Update the thread
      const { error } = await supabase
        .from("forum_topics")
        .update({
          title: trimmedTitle,
          body: trimmedBody
        })
        .eq("id", thread.id)

      if (error) throw error

      toast.success("Post updated successfully")
      router.push(`/forum/thread/${thread.id}`)
      router.refresh()
    } catch (error: any) {
      console.error("Error updating post:", error)
      toast.error(error.message || "Failed to update post")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post title"
          required
        />
      </div>

      <div>
        <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <Textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Describe your post"
          rows={6}
          required
        />
      </div>

      <div className="flex justify-end space-x-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/forum/thread/${thread.id}`)}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Updating..." : "Update Post"}
        </Button>
      </div>
    </form>
  )
}

