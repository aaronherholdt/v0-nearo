import HubsExplorer from "@/components/hubs/HubsExplorer"
import { listPublicHubs } from "@/lib/hubs"
import Link from "next/link"
import IconPageShell from "@/components/icon-page-shell"

export default async function HubsPage() {
  const hubs = await listPublicHubs()

  return (
    <IconPageShell contentClassName="flex flex-col">
      <main className="mx-auto max-w-7xl space-y-6 p-4 w-full">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/forum"
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              Back to forum
            </Link>
            <h1 className="text-xl font-semibold">Hubs</h1>
          </div>
          <Link
            href="/list-your-hub"
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            List your hub
          </Link>
        </div>
        <HubsExplorer hubs={hubs} />
      </main>
    </IconPageShell>
  )
}
