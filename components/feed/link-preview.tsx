"use client"

type LinkPreviewData = {
  url?: string
  image?: string | null
  domain?: string | null
  title?: string | null
  desc?: string | null
}

export default function LinkPreview({ data }: { data?: LinkPreviewData | null }) {
  if (!data?.url) return null

  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block border rounded-xl overflow-hidden transition-colors hover:bg-gray-50"
    >
      {data.image && (
        <img
          src={data.image}
          alt=""
          className="w-full aspect-video object-cover"
          loading="lazy"
        />
      )}
      <div className="p-3 space-y-1.5">
        {data.domain && <div className="text-xs text-gray-500">{data.domain}</div>}
        {data.title && <div className="text-sm font-medium text-gray-900">{data.title}</div>}
        {data.desc && (
          <div className="text-sm text-gray-600 line-clamp-2">
            {data.desc}
          </div>
        )}
      </div>
    </a>
  )
}
