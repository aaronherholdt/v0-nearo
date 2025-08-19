import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface MessageBubbleProps {
  message: {
    id: string
    content: string
    created_at: string
    sender_family_id: string
  }
  isOwnMessage: boolean
  senderName: string
}

export default function MessageBubble({ message, isOwnMessage, senderName }: MessageBubbleProps) {
  return (
    <div className={cn("flex", isOwnMessage ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-xs lg:max-w-md", isOwnMessage ? "order-1" : "order-2")}>
        <div
          className={cn(
            "px-4 py-2 rounded-lg",
            isOwnMessage
              ? "bg-emerald-600 text-white rounded-br-sm"
              : "bg-white border border-gray-200 text-gray-900 rounded-bl-sm",
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
        <div className={cn("mt-1 text-xs text-gray-500", isOwnMessage ? "text-right" : "text-left")}>
          {!isOwnMessage && <span className="font-medium">{senderName} • </span>}
          {format(new Date(message.created_at), "MMM d, h:mm a")}
        </div>
      </div>
    </div>
  )
}
