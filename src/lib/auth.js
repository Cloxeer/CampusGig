import { supabase } from "./supabase";

// ──────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────

const ALLOWED_DOMAINS = ["nmsu.edu"];

/** Returns true if the email belongs to an allowed school domain. */
export function isEduEmail(email) {
  const trimmed = email?.trim().toLowerCase();
  if (!trimmed) return false;
  return ALLOWED_DOMAINS.some((d) => trimmed.endsWith(`@${d}`));
}

// ──────────────────────────────────────────────────
// Magic Link (passwordless)
// ──────────────────────────────────────────────────

let lastMagicLinkAt = 0;
const MAGIC_LINK_COOLDOWN_MS = 10_000;

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
      error: { message: "Only @nmsu.edu email addresses are allowed." },
    };
  }

  const now = Date.now();
  if (now - lastMagicLinkAt < MAGIC_LINK_COOLDOWN_MS) {
    const wait = Math.ceil((MAGIC_LINK_COOLDOWN_MS - (now - lastMagicLinkAt)) / 1000);
    return {
      data: null,
      error: { message: `Please wait ${wait}s before requesting another link.` },
    };
  }

  const otpOptions = {
    emailRedirectTo: `${window.location.origin}/`,
  };
  if (typeof options.shouldCreateUser === "boolean") {
    otpOptions.shouldCreateUser = options.shouldCreateUser;
  }
  if (options.firstName || options.lastName) {
    otpOptions.data = {
      first_name: options.firstName?.trim(),
      last_name: options.lastName?.trim(),
    };
  }

  lastMagicLinkAt = Date.now();

  const { data, error } = await supabase.auth.signInWithOtp({
    email: trimmedEmail,
    options: otpOptions,
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
