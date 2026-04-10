import { supabase } from "./supabase";

// ──────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────

/** Returns true if the email ends with .edu (case-insensitive). */
export function isEduEmail(email) {
  return /\.edu$/i.test(email?.trim());
}

// ──────────────────────────────────────────────────
// Sign-up  (email + password)
// ──────────────────────────────────────────────────

/**
 * Creates a new account. Only .edu emails are accepted.
 * After sign-up the user must verify their email (Supabase will send
 * a confirmation link automatically).
 *
 * @param {{ email: string, password: string, firstName: string, lastName: string }}
 * @returns {{ data, error }}
 */
export async function signUp({ email, password, firstName, lastName }) {
  const trimmedEmail = email?.trim().toLowerCase();

  if (!isEduEmail(trimmedEmail)) {
    return {
      data: null,
      error: { message: "Only .edu email addresses are allowed. Please use your university email." },
    };
  }

  if (!password || password.length < 6) {
    return {
      data: null,
      error: { message: "Password must be at least 6 characters." },
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email: trimmedEmail,
    password,
    options: {
      data: {
        first_name: firstName?.trim(),
        last_name: lastName?.trim(),
      },
    },
  });

  return { data, error };
}

// ──────────────────────────────────────────────────
// Login  (email + password)
// ──────────────────────────────────────────────────

/**
 * Signs in with email and password.
 *
 * @param {{ email: string, password: string }}
 * @returns {{ data, error }}
 */
export async function login({ email, password }) {
  const trimmedEmail = email?.trim().toLowerCase();

  if (!isEduEmail(trimmedEmail)) {
    return {
      data: null,
      error: { message: "Only .edu email addresses are allowed." },
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: trimmedEmail,
    password,
  });

  return { data, error };
}

// ──────────────────────────────────────────────────
// Magic Link (passwordless)
// ──────────────────────────────────────────────────

/**
 * Sends a magic link to the supplied .edu email.
 *
 * @param {string} email
 * @returns {{ data, error }}
 */
export async function sendMagicLink(email) {
  const trimmedEmail = email?.trim().toLowerCase();

  if (!isEduEmail(trimmedEmail)) {
    return {
      data: null,
      error: { message: "Only .edu email addresses are allowed." },
    };
  }

  const { data, error } = await supabase.auth.signInWithOtp({
    email: trimmedEmail,
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
