type HubsEmptyStateProps = {
  hasFilters?: boolean
  onResetFilters?: () => void
}

export default function HubsEmptyState({ hasFilters, onResetFilters }: HubsEmptyStateProps) {
  return (
    <div className="rounded-xl border bg-white p-12 text-center">
      {/* Illustration */}
      <div className="mx-auto mb-6 w-48">
        <svg
          viewBox="0 0 200 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
        >
          {/* Map background */}
          <rect x="20" y="20" width="160" height="120" rx="8" fill="#F3F4F6" />

          {/* Grid lines */}
          <line x1="100" y1="20" x2="100" y2="140" stroke="#E5E7EB" strokeWidth="1" />
          <line x1="20" y1="80" x2="180" y2="80" stroke="#E5E7EB" strokeWidth="1" />

          {/* Location pins (faded) */}
          <g opacity="0.3">
            <circle cx="60" cy="50" r="3" fill="#10B981" />
            <path d="M60 45 L60 50 L58 52" stroke="#10B981" strokeWidth="1.5" fill="none" />

            <circle cx="140" cy="60" r="3" fill="#10B981" />
            <path d="M140 55 L140 60 L138 62" stroke="#10B981" strokeWidth="1.5" fill="none" />

            <circle cx="80" cy="110" r="3" fill="#10B981" />
            <path d="M80 105 L80 110 L78 112" stroke="#10B981" strokeWidth="1.5" fill="none" />
          </g>

          {/* Magnifying glass */}
          <circle cx="120" cy="95" r="20" stroke="#D1D5DB" strokeWidth="3" fill="white" />
          <line x1="135" y1="110" x2="150" y2="125" stroke="#D1D5DB" strokeWidth="4" strokeLinecap="round" />

          {/* Question mark inside magnifying glass */}
          <text x="120" y="105" fontSize="24" fill="#9CA3AF" textAnchor="middle" fontWeight="bold">?</text>
        </svg>
      </div>

      {/* Message */}
      <h3 className="mb-2 text-lg font-semibold text-gray-900">
        {hasFilters ? "No hubs match your filters" : "No hubs available yet"}
      </h3>
      <p className="mx-auto mb-6 max-w-md text-sm text-gray-600">
        {hasFilters
          ? "Try adjusting your search criteria or filters to find more hubs in other locations."
          : "We're currently building our network of family-friendly hubs. Check back soon for new listings!"}
      </p>

      {/* Actions */}
      {hasFilters && onResetFilters && (
        <button
          onClick={onResetFilters}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Reset all filters
        </button>
      )}
    </div>
  )
}
