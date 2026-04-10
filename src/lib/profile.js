import { supabase } from "./supabase";

// ──────────────────────────────────────────────────
// Get profile
// ──────────────────────────────────────────────────

/**
 * Fetches the current user's profile row.
 * Relies on the RLS policy "Users can view all users" (SELECT).
 *
 * @returns {{ profile: object|null, error }}
 */
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

/**
 * Fetches any user's profile by ID.
 *
 * @param {string} userId
 * @returns {{ profile: object|null, error }}
 */
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

/**
 * Inserts a new profile row for the authenticated user.
 * Called once after sign-up (during onboarding).
 *
 * @param {{ phone: string, firstName: string, lastName: string, email: string, venmo?: string, cashapp?: string, paypal?: string, snapchat?: string, avatarColor?: string }}
 * @returns {{ profile: object|null, error }}
 */
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

/**
 * Updates the current user's profile.
 * Only send the fields you want to change.
 *
 * @param {object} updates  – keys can be: first_name, last_name, phone,
 *                            venmo, cashapp, paypal, snapchat, avatar_color
 * @returns {{ profile: object|null, error }}
 */
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

/**
 * Returns reviews written about the current user.
 * Joins reviewer info from the users table.
 */
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

/**
 * Returns the count of completed gigs for the current user (as taker).
 */
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

/**
 * Returns the campus rank for a user based on rep_score.
 * Rank = number of users with a higher rep_score + 1.
 */
export async function getCampusRank(repScore) {
  const { count, error } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .gt("rep_score", repScore);

  return { rank: (count || 0) + 1, error };
}

/**
 * Returns the total number of users on the platform.
 */
export async function getTotalUsers() {
  const { count, error } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true });

  return { total: count || 0, error };
}

/**
 * Returns the top users by rep_score for the leaderboard.
 */
export async function getLeaderboard(limit = 10) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("users")
    .select("id, first_name, last_name, avatar_color, rep_score")
    .order("rep_score", { ascending: false })
    .limit(limit);

  const leaderboard = (data || []).map((u, i) => ({
    rank: i + 1,
    name: `${u.first_name} ${u.last_name?.charAt(0)}.`,
    initials: `${u.first_name?.charAt(0) || ""}${u.last_name?.charAt(0) || ""}`.toUpperCase(),
    color: u.avatar_color || "#6366f1",
    rep: u.rep_score || 0,
    isYou: user?.id === u.id,
  }));

  return { leaderboard, error };
}

/**
 * Returns recent activity for the current user:
 * completed gigs + reviews received, sorted by time.
 */
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
// Avatar (profile photo)
// ──────────────────────────────────────────────────

/**
 * Uploads a profile photo to the 'avatars' bucket.
 * File is stored as `{userId}/avatar.{ext}` so each user only has one.
 * Returns the storage path (not the public URL).
 */
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

/**
 * Returns the public URL for an avatar storage path.
 */
export function getAvatarUrl(avatarPath) {
  if (!avatarPath) return null;
  const { data } = supabase.storage.from("avatars").getPublicUrl(avatarPath);
  return data?.publicUrl || null;
}

// ──────────────────────────────────────────────────
// Delete profile (and account)
// ──────────────────────────────────────────────────

/**
 * Deletes the current user's profile row.
 * NOTE: This only removes the row from the `users` table.
 * To fully delete the auth account you need a server-side admin call
 * or Supabase Edge Function (see manual steps).
 *
 * @returns {{ error }}
 */
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
