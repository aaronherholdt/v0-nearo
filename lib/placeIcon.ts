import { IconHome2, IconBuilding, IconTrees, type IconProps } from "@tabler/icons-react";
import React from "react";

export function placeTypeToIcon(type?: string): React.ComponentType<IconProps> {
  const t = (type || "").toLowerCase();
  if (t.includes("museum")) return IconBuilding; // museum/building style
  if (t.includes("park") || t.includes("garden") || t.includes("nature")) return IconTrees;
  return IconHome2; // default "place"
}
