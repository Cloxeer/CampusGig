import { supabase } from "./supabase";
import { getLevel } from "../utils/helpers";

// ──────────────────────────────────────────────────
// Get profile
// ──────────────────────────────────────────────────

export async function getMyProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { profile: null, error: { message: "Not authenticated" } };

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return { profile: data, error };
}

export async function getProfileById(userId) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  return { profile: data, error };
}

// ──────────────────────────────────────────────────
// Create profile (used during onboarding)
// ──────────────────────────────────────────────────

export async function createProfile({
  phone,
  firstName,
  lastName,
  email,
  venmo,
  cashapp,
  paypal,
  snapchat,
  avatarColor,
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { profile: null, error: { message: "Not authenticated" } };

  const row = {
    id: user.id,
    first_name: firstName,
    last_name: lastName,
    email: email || user.email,
    phone,
    ...(venmo && { venmo }),
    ...(cashapp && { cashapp }),
    ...(paypal && { paypal }),
    ...(snapchat && { snapchat }),
    ...(avatarColor && { avatar_color: avatarColor }),
  };

  const { data, error } = await supabase
    .from("users")
    .insert(row)
    .select()
    .single();

  return { profile: data, error };
}

// ──────────────────────────────────────────────────
// Update profile
// ──────────────────────────────────────────────────

export async function updateMyProfile(updates) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { profile: null, error: { message: "Not authenticated" } };

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();

  return { profile: data, error };
}

// ──────────────────────────────────────────────────
// Profile stats (real data)
// ──────────────────────────────────────────────────

export async function getMyReviews() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { reviews: [], error: { message: "Not authenticated" } };

  const { data, error } = await supabase
    .from("reviews")
    .select("id, rating, text, created_at, reviewer:reviewer_id(first_name, last_name, avatar_color)")
    .eq("reviewee_id", user.id)
    .order("created_at", { ascending: false });

  return { reviews: data || [], error };
}

export async function getMyGigStats() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { completed: 0, posted: 0, error: { message: "Not authenticated" } };

  const [takerRes, posterRes] = await Promise.all([
    supabase
      .from("gigs")
      .select("id", { count: "exact", head: true })
      .eq("taker_id", user.id)
      .eq("status", "completed"),
    supabase
      .from("gigs")
      .select("id", { count: "exact", head: true })
      .eq("poster_id", user.id),
  ]);

  return {
    completed: takerRes.count || 0,
    posted: posterRes.count || 0,
    error: takerRes.error || posterRes.error,
  };
}

export async function getCampusRank(repScore) {
  const { count, error } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .gt("rep_score", repScore);

  return { rank: (count || 0) + 1, error };
}

export async function getTotalUsers() {
  const { count, error } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true });

  return { total: count || 0, error };
}

export async function getLeaderboard(limit = 10) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("users")
    .select("id, first_name, last_name, avatar_color, avatar_url, rep_score")
    .order("rep_score", { ascending: false })
    .limit(limit);

  const leaderboard = (data || []).map((u, i) => ({
    rank: i + 1,
    name: `${u.first_name} ${u.last_name?.charAt(0)}.`,
    initials: `${u.first_name?.charAt(0) || ""}${u.last_name?.charAt(0) || ""}`.toUpperCase(),
    color: u.avatar_color || "#6366f1",
    avatarUrl: u.avatar_url ? getAvatarUrl(u.avatar_url) : null,
    rep: u.rep_score || 0,
    isYou: user?.id === u.id,
  }));

  return { leaderboard, error };
}

export async function getMyActivity() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { activity: [], error: { message: "Not authenticated" } };

  const [gigsRes, reviewsRes, postedRes] = await Promise.all([
    supabase
      .from("gigs")
      .select("id, title, price, status, created_at, updated_at, category:category_id(label)")
      .eq("taker_id", user.id)
      .eq("status", "completed")
      .order("updated_at", { ascending: false })
      .limit(10),
    supabase
      .from("reviews")
      .select("id, rating, text, created_at, reviewer:reviewer_id(first_name, last_name)")
      .eq("reviewee_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("gigs")
      .select("id, title, status, created_at, category:category_id(label)")
      .eq("poster_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return {
    completedGigs: gigsRes.data || [],
    receivedReviews: reviewsRes.data || [],
    postedGigs: postedRes.data || [],
    error: gigsRes.error || reviewsRes.error || postedRes.error,
  };
}

// ──────────────────────────────────────────────────
// Gigs (open feed + posting)
// ──────────────────────────────────────────────────

export async function getOpenGigs() {
  const { data, error } = await supabase
    .from("gigs")
    .select(`
      id, title, price, location, estimated_time, notes, status, created_at,
      category:category_id(label, icon_name),
      poster:poster_id(id, first_name, last_name, avatar_color, avatar_url, rep_score)
    `)
    .eq("status", "open")
    .order("created_at", { ascending: false });

  return { gigs: data || [], error };
}

export function normalizeGig(g) {
  const poster = g.poster || {};
  const firstName = poster.first_name || "";
  const lastName = poster.last_name || "";
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const posterName = lastName ? `${firstName} ${lastName.charAt(0)}.` : firstName;
  const repScore = poster.rep_score || 0;
  const level = getLevel(repScore);

  return {
    id: g.id,
    title: g.title,
    price: `$${Number(g.price).toFixed(2)}`,
    cat: g.category?.label || "Other",
    loc: g.location || "TBD",
    eta: g.estimated_time || "—",
    poster: posterName,
    posterId: poster.id,
    initials,
    color: poster.avatar_color || "#6366f1",
    avatarUrl: poster.avatar_url ? getAvatarUrl(poster.avatar_url) : null,
    levelLabel: level.label,
    postedAt: new Date(g.created_at).getTime(),
    notes: g.notes || "No additional notes.",
  };
}

export async function postNewGig({ title, categoryLabel, price, location }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { gig: null, error: { message: "Not authenticated" } };

  const { data: cat } = await supabase
    .from("categories")
    .select("id")
    .eq("label", categoryLabel)
    .single();

  if (!cat) return { gig: null, error: { message: "Invalid category" } };

  const { data, error } = await supabase
    .from("gigs")
    .insert({
      poster_id: user.id,
      category_id: cat.id,
      title,
      price: price || 0,
      location,
    })
    .select()
    .single();

  return { gig: data, error };
}

// ──────────────────────────────────────────────────
// Notifications
// ──────────────────────────────────────────────────

export async function getMyNotifications() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { notifications: [], error: { message: "Not authenticated" } };

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return { notifications: data || [], error };
}

export async function markAllNotificationsRead() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: { message: "Not authenticated" } };

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);

  return { error };
}

// ──────────────────────────────────────────────────
// Avatar (profile photo)
// ──────────────────────────────────────────────────

export async function uploadAvatar(file) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { path: null, error: { message: "Not authenticated" } };

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { path: null, error: uploadError };

  const { error: updateError } = await supabase
    .from("users")
    .update({ avatar_url: path })
    .eq("id", user.id);

  return { path, error: updateError };
}

export function getAvatarUrl(avatarPath) {
  if (!avatarPath) return null;
  const { data } = supabase.storage.from("avatars").getPublicUrl(avatarPath);
  return data?.publicUrl || null;
}

// ──────────────────────────────────────────────────
// Delete profile (and account)
// ──────────────────────────────────────────────────

export async function deleteMyProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: { message: "Not authenticated" } };

  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", user.id);

  return { error };
}
