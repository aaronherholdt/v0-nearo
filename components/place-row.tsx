import IconBadge from "@/components/ui/IconBadge";
import { placeTypeToIcon } from "@/lib/placeIcon";

export default function PlaceRow({ name, type }: { name: string; type?: string }) {
  const Icon = placeTypeToIcon(type);
  return (
    <div className="flex items-start gap-2 py-1">
      <IconBadge Icon={Icon} className="mt-0.5" />
      <div>
        <div className="font-medium">{name}</div>
        {type && <div className="text-xs text-gray-500">{type}</div>}
      </div>
    </div>
  );
}
