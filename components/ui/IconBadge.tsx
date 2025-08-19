import { type IconProps } from "@tabler/icons-react";
import React from "react";

type Props = {
  Icon: React.ComponentType<IconProps>;
  bg?: string;       // tailwind class for background
  ring?: string;     // tailwind class for ring
  className?: string;
};

export default function IconBadge({ Icon, bg="bg-white", ring="ring-gray-200", className="" }: Props) {
  return (
    <span
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-inset ${bg} ${ring} ${className}`}
      aria-hidden="true"
    >
      <Icon size={18} stroke={1.75} />
    </span>
  );
}
