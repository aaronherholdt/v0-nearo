import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export async function fetchNotifications(userId: string) {
  const supabase = createClientComponentClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function markAllAsRead(userId: string) {
  const supabase = createClientComponentClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  if (error) throw error;
}
