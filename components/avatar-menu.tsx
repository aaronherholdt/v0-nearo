"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { createClientComponentClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { IconUser, IconUsers, IconCalendar, IconLogout } from "@tabler/icons-react";

type Props = {
  user: { id: string; email?: string; user_metadata?: Record<string, any> } | null;
  family: { id: string; family_name?: string | null; family_photo_url?: string | null } | null;
};

export default function AvatarMenu({ user, family }: Props) {
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Show a sign-in button if not authenticated
  if (!user) {
    return (
      <Link
        href="/login"
        className="cursor-pointer inline-flex items-center rounded px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700"
      >
        Sign in
      </Link>
    );
  }

  const avatarUrl =
    family?.family_photo_url ||
    (user.user_metadata && (user.user_metadata.avatar_url || user.user_metadata.picture)) ||
    "";

  const fallbackInitial = useMemo(() => {
    const fromFamily = (family?.family_name || "").trim();
    const fromEmail = (user.email || "").trim();
    const char = (fromFamily[0] || fromEmail[0] || "A").toUpperCase();
    return char;
  }, [family?.family_name, user.email]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="cursor-pointer inline-flex items-center justify-center rounded-full hover:ring-2 hover:ring-gray-200"
          aria-label="Open profile menu"
          title="Profile"
        >
          <Avatar className="h-8 w-8">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt="Profile" />
            ) : (
              <AvatarFallback>{fallbackInitial}</AvatarFallback>
            )}
          </Avatar>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content
        className="z-50 w-52 rounded-md border bg-white p-1 shadow-md"
        align="end"
        sideOffset={8}
      >
        {/* Header / identity row */}
        <div className="px-2 py-2 text-xs text-gray-500">
          {family?.family_name ? family.family_name : user.email}
        </div>

        <DropdownMenu.Separator className="my-1 h-px bg-gray-200" />

        <DropdownMenu.Item asChild className="flex cursor-pointer select-none items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-100">
          <Link href="/profile">
            <span className="inline-flex items-center gap-2">
              <IconUser className="h-4 w-4" /> My Profile
            </span>
          </Link>
        </DropdownMenu.Item>

        <DropdownMenu.Item asChild className="flex cursor-pointer select-none items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-100">
          <Link href="/family">
            <span className="inline-flex items-center gap-2">
              <IconUsers className="h-4 w-4" /> Family Details
            </span>
          </Link>
        </DropdownMenu.Item>

        <DropdownMenu.Item asChild className="flex cursor-pointer select-none items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-100">
          <Link href="/trips/history">
            <span className="inline-flex items-center gap-2">
              <IconCalendar className="h-4 w-4" /> Travel History
            </span>
          </Link>
        </DropdownMenu.Item>

        <DropdownMenu.Separator className="my-1 h-px bg-gray-200" />

        <DropdownMenu.Item
          className="flex cursor-pointer select-none items-center gap-2 rounded px-2 py-2 text-sm text-red-600 hover:bg-red-50"
          onSelect={handleSignOut}
        >
          <IconLogout className="h-4 w-4" /> Sign out
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}

