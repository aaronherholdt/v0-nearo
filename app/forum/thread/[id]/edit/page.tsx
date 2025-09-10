import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import EditMeetupForm from "@/components/edit-meetup-form"
import EditTripForm from "@/components/edit-trip-form"
import EditGeneralForm from "@/components/edit-general-form"

export default async function EditThreadPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch the thread
  const { data: thread, error } = await supabase
    .from("forum_topics")
    .select(`
      *,
      author:author_id(id, family_name)
    `)
    .eq("id", params.id)
    .single()

  if (error || !thread) {
    notFound()
  }

  // Check if user is the author of the thread
  if (thread.author_id !== user.id) {
    redirect(`/forum/thread/${params.id}`)
  }

  // Determine which form to show based on category
  const getFormComponent = () => {
    switch (thread.category) {
      case "meetups":
        return <EditMeetupForm thread={thread} />
      case "trips":
        return <EditTripForm thread={thread} />
      case "general":
      default:
        return <EditGeneralForm thread={thread} />
    }
  }

  const getTitle = () => {
    switch (thread.category) {
      case "meetups":
        return "Edit Meetup"
      case "trips":
        return "Edit Trip"
      case "general":
      default:
        return "Edit Post"
    }
  }

  const getBackText = () => {
    return "Back to Post"
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-4">
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Link href={`/forum/thread/${params.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {getBackText()}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{getTitle()}</CardTitle>
        </CardHeader>
        <CardContent>
          {getFormComponent()}
        </CardContent>
      </Card>
    </div>
  )
}
