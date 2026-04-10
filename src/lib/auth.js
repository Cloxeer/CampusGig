import { supabase } from "./supabase";

// ──────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────

/** Returns true if the email ends with .edu (case-insensitive). */
export function isEduEmail(email) {
  return /\.edu$/i.test(email?.trim());
}

// ──────────────────────────────────────────────────
// Magic Link (passwordless)
// ──────────────────────────────────────────────────

/**
 * Sends a magic link to the supplied .edu email.
 * With shouldCreateUser true, existing users still receive a link and sign in — no duplicate-email error.
 *
 * @param {string} email
 * @param {object} [options]
 * @returns {{ data, error }}
 */
export async function sendMagicLink(email, options = {}) {
  const trimmedEmail = email?.trim().toLowerCase();

  if (!isEduEmail(trimmedEmail)) {
    return {
      data: null,
      error: { message: "Only .edu email addresses are allowed." },
    };
  }

  const otpOptions = {};
  if (typeof options.shouldCreateUser === "boolean") {
    otpOptions.shouldCreateUser = options.shouldCreateUser;
  }
  if (options.firstName || options.lastName) {
    otpOptions.data = {
      first_name: options.firstName?.trim(),
      last_name: options.lastName?.trim(),
    };
  }

  const { data, error } = await supabase.auth.signInWithOtp({
    email: trimmedEmail,
    options: Object.keys(otpOptions).length > 0 ? otpOptions : undefined,
  });

  return { data, error };
}

// ──────────────────────────────────────────────────
// Logout
// ──────────────────────────────────────────────────

export async function logout() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// ──────────────────────────────────────────────────
// Session helpers
// ──────────────────────────────────────────────────

/** Returns the current session (or null). */
export async function getSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  return { session, error };
}

/** Returns the current user (or null). */
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { user, error };
}

/**
 * Subscribes to auth state changes.
 * Returns the unsubscribe function.
 *
 * @param {(event: string, session: object|null) => void} callback
 * @returns {() => void} unsubscribe
 */
export function onAuthStateChange(callback) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(callback);
  return () => subscription.unsubscribe();
}
