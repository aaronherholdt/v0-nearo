import { createClientComponentClient } from "@/lib/supabase/client";

const supabase = createClientComponentClient();

export async function fetchNotifications(userId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, title, body, link, created_at, seen_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  // normalize for UI
  return (data || []).map(n => ({ ...n, message: n.body }));
}

export async function markAllAsRead(userId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ seen_at: new Date().toISOString() })
    .is("seen_at", null)
    .eq("user_id", userId);
  if (error) throw error;
}

