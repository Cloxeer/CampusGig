import { supabase } from "./supabase";
import { ACTIVE_REQUEST_ALERT_TYPE } from "./notificationTypes";

export async function getMyNotifications() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { notifications: [], error: { message: "Not authenticated" } };

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return { notifications: data || [], error };
}

export async function getUnreadNotificationCount() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { count: 0 };

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false);

  return { count: error ? 0 : (count || 0) };
}

export async function markAllNotificationsRead() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: { message: "Not authenticated" } };

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false)
    .neq("type", ACTIVE_REQUEST_ALERT_TYPE);

  return { error };
}

export async function markNotificationRead(notificationId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: { message: "Not authenticated" } };

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  return { error };
}

export async function deleteNotification(notificationId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: { message: "Not authenticated" } };

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .eq("user_id", user.id);

  return { error };
}
