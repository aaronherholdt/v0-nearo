"use client";

import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Settings } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getUserSettings, upsertUserSettings, updateFamilyBasics } from "@/utils/settings";

type Props = {
  user: { id: string } | null;
  family: {
    id: string;
    family_name?: string;
    family_description?: string | null;
    homeschool_style?: string | null;
  } | null;
};

const HOMESCHOOL_STYLES = [
  "Classical",
  "Charlotte Mason",
  "Montessori",
  "Unschooling",
  "Eclectic",
  "Project-based",
];

export default function SettingsSheet({ user, family }: Props) {
  const supabase = createClientComponentClient();
  const router = useRouter();

  // UI state
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Profile (families table)
  const [familyName, setFamilyName] = useState(family?.family_name ?? "");
  const [familyDescription, setFamilyDescription] = useState(family?.family_description ?? "");
  const [homeschoolStyle, setHomeschoolStyle] = useState(family?.homeschool_style ?? "");

  // User settings (user_settings table)
  const [emailOptIn, setEmailOptIn] = useState(true);
  const [appOptIn, setAppOptIn] = useState(true);
  const [childrenAgesInput, setChildrenAgesInput] = useState(""); // comma-separated string
  const [tripLength, setTripLength] = useState(7);

  // Load settings on open (or first render)
  useEffect(() => {
    async function load() {
      if (!user?.id) return;
      const s = await getUserSettings(user.id);
      if (s) {
        setEmailOptIn(s.email_opt_in);
        setAppOptIn(s.app_opt_in);
        setChildrenAgesInput((s.children_ages ?? []).join(", "));
        setTripLength(s.preferred_trip_length_days ?? 7);
      }
    }
    load();
  }, [user?.id]);

  // Parse ages safely
  const parsedAges = useMemo(() => {
    return childrenAgesInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .map((n) => Number(n))
      .filter((n) => Number.isFinite(n) && n >= 0 && n <= 21);
  }, [childrenAgesInput]);

  async function handleSave() {
    if (!user?.id || !family?.id) {
      toast.error("Not signed in or family not loaded");
      return;
    }
    setSaving(true);
    try {
      // 1) Save user settings
      await upsertUserSettings({
        user_id: user.id,
        email_opt_in: emailOptIn,
        app_opt_in: appOptIn,
        children_ages: parsedAges,
        preferred_trip_length_days: tripLength || 7,
      });

      // 2) Save family basics
      await updateFamilyBasics(family.id, {
        family_name: familyName || undefined,
        family_description: familyDescription || undefined,
        homeschool_style: homeschoolStyle || undefined,
      });

      toast.success("Settings saved");
      setOpen(false);
      router.refresh();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          className="relative cursor-pointer inline-flex items-center justify-center p-2 rounded hover:bg-gray-100"
          aria-label="Open settings"
          title="Settings"
        >
          <Settings className="h-6 w-6" />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20" />
        <Dialog.Content
          className="
            fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl
            p-4 md:p-6 overflow-y-auto
          "
        >
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold">Settings</Dialog.Title>
            <Dialog.Close className="cursor-pointer rounded p-2 hover:bg-gray-100">✕</Dialog.Close>
          </div>

          {/* Profile */}
          <section className="space-y-2 mb-6">
            <h3 className="font-medium text-gray-900">Profile</h3>
            <label className="block text-sm text-gray-600">Family name</label>
            <input
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              className="w-full rounded border p-2"
              placeholder="e.g., The Herholdts"
            />
            <label className="block text-sm text-gray-600 mt-2">Family description</label>
            <textarea
              value={familyDescription ?? ""}
              onChange={(e) => setFamilyDescription(e.target.value)}
              className="w-full rounded border p-2 min-h-[80px]"
              placeholder="Short bio for other families"
            />
            <label className="block text-sm text-gray-600 mt-2">Homeschool style</label>
            <select
              value={homeschoolStyle ?? ""}
              onChange={(e) => setHomeschoolStyle(e.target.value)}
              className="w-full rounded border p-2"
            >
              <option value="">Select style</option>
              {HOMESCHOOL_STYLES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </section>

          {/* Notifications */}
          <section className="space-y-2 mb-6">
            <h3 className="font-medium text-gray-900">Notifications</h3>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={emailOptIn}
                onChange={(e) => setEmailOptIn(e.target.checked)}
                className="h-4 w-4"
              />
              <span>Email notifications</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={appOptIn}
                onChange={(e) => setAppOptIn(e.target.checked)}
                className="h-4 w-4"
              />
              <span>In-app notifications</span>
            </label>
          </section>

          {/* Travel defaults */}
          <section className="space-y-2 mb-6">
            <h3 className="font-medium text-gray-900">Travel preferences</h3>
            <label className="block text-sm text-gray-600">Children ages (comma-separated)</label>
            <input
              value={childrenAgesInput}
              onChange={(e) => setChildrenAgesInput(e.target.value)}
              className="w-full rounded border p-2"
              placeholder="e.g., 6, 10, 13"
            />
            <label className="block text-sm text-gray-600 mt-2">Preferred trip length (days)</label>
            <input
              type="number"
              min={1}
              max={90}
              value={tripLength}
              onChange={(e) => setTripLength(Number(e.target.value))}
              className="w-full rounded border p-2"
              placeholder="7"
            />
            {/* Small helper */}
            <p className="text-xs text-gray-500">
              Parsed ages: {parsedAges.length ? parsedAges.join(", ") : "none"}
            </p>
          </section>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handleSignOut}
              className="cursor-pointer rounded border border-gray-300 px-3 py-2 hover:bg-gray-50"
            >
              Sign out
            </button>
            <button
              disabled={saving}
              onClick={handleSave}
              className="cursor-pointer rounded bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save settings"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
