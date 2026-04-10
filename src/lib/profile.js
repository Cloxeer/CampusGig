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
