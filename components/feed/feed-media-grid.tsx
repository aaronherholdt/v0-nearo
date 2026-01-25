"use client"

import Image from "next/image"

type MediaItem = {
  url: string
  alt?: string | null
  w?: number | null
  h?: number | null
}

export default function FeedMediaGrid({ media }: { media?: MediaItem[] | null }) {
  if (!media || media.length === 0) return null

  const items = media.filter(Boolean).slice(0, 4) as MediaItem[]
  if (items.length === 0) return null

  const layout =
    items.length === 1 ? "grid-cols-1" :
    items.length === 2 ? "grid-cols-2 gap-1" :
    "grid-cols-2 gap-1"

  return (
    <div className={`grid ${layout} rounded-xl overflow-hidden`}>
      {items.map((item, index) => {
        const width = item.w ?? 800
        const height = item.h ?? 800
        const spanClass = items.length === 3 && index === 0 ? "col-span-2" : ""
        return (
          <button
            key={`${item.url}-${index}`}
            className={`${spanClass} group relative`}
            type="button"
          >
            <Image
              src={item.url}
              alt={item.alt ?? ""}
              width={width}
              height={height}
              className="h-auto w-full object-cover transition-transform duration-200 group-hover:scale-[1.015]"
              loading={index < 2 ? "eager" : "lazy"}
            />
          </button>
        )
      })}
    </div>
  )
}
