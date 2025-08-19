import IconBadge from "@/components/ui/IconBadge";
import { IconPlane, IconHome2, IconUsersGroup } from "@tabler/icons-react";
import Link from "next/link";

function HeaderCard({
  title,
  Icon,
  colorClasses,
  href,
}: {
  title: string;
  Icon: any;
  colorClasses: { bg: string; text: string; ring: string; hover: string };
  href: string;
}) {
  return (
    <Link href={href} className="block">
      <div
        className={`flex items-center gap-3 rounded-2xl p-4 ring-1 ${colorClasses.bg} ${colorClasses.ring} ${colorClasses.text}
                  transition hover:shadow-md ${colorClasses.hover} cursor-pointer`}
        role="button"
        tabIndex={0}
      >
        <IconBadge Icon={Icon} bg="bg-white/70" ring="ring-white/40" />
        <span className="font-medium">{title}</span>
      </div>
    </Link>
  );
}

export default function TopSummary() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <HeaderCard
        title="Travel Plans"
        Icon={IconPlane}
        href="/travel-plans"
        colorClasses={{
          bg: "bg-emerald-50",
          text: "text-emerald-700",
          ring: "ring-emerald-200",
          hover: "hover:bg-emerald-100",
        }}
      />
      <HeaderCard
        title="Recommended Places"
        Icon={IconHome2}
        href="/discover"
        colorClasses={{
          bg: "bg-orange-50",
          text: "text-orange-700",
          ring: "ring-orange-200",
          hover: "hover:bg-orange-100",
        }}
      />
      <HeaderCard
        title="Recommended Families"
        Icon={IconUsersGroup}
        href="/matches"
        colorClasses={{
          bg: "bg-indigo-50",
          text: "text-indigo-700",
          ring: "ring-indigo-200",
          hover: "hover:bg-indigo-100",
        }}
      />
    </div>
  );
}