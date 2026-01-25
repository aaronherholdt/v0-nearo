// utils/settings.ts
"use client";

import { createClientComponentClient } from "@/lib/supabase/client";

export type UserSettings = {
  user_id: string;
  email_opt_in: boolean;
  app_opt_in: boolean;
  children_ages: number[];
  preferred_trip_length_days: number;
};

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const supabase = createClientComponentClient();
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows found
    console.error("getUserSettings error:", error);
  }

  return (data as UserSettings) ?? null;
}

export async function upsertUserSettings(payload: UserSettings) {
  const supabase = createClientComponentClient();
  const { error } = await supabase
    .from("user_settings")
    .upsert(payload, { onConflict: "user_id" });
  if (error) throw error;
}

export async function updateFamilyBasics(familyId: string, updates: {
  family_name?: string;
  family_description?: string;
  homeschool_style?: string;
}) {
  const supabase = createClientComponentClient();
  const { error } = await supabase
    .from("families")
    .update(updates)
    .eq("id", familyId);
  if (error) throw error;
}

