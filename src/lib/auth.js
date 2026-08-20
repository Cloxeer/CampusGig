import { supabase } from "./supabase";
import { validatePasscode } from "../utils/passcodeValidation";
import { passcodeToAuthPassword, mapPasscodeAuthError } from "../utils/passcodeAuth";

// ──────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────

const ALLOWED_DOMAINS = ["nmsu.edu"];

/** Basic shape check for client (non-student) emails. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns true if the email is Main Campus @nmsu.edu only (exact domain; excludes *.nmsu.edu subdomains like dacc, alamogordo, grants, global). */
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
 * Sends a magic link. Student signup requires an exact @nmsu.edu email; pass
 * allowAnyEmail (login flows) so client accounts can also sign in by link.
 * With shouldCreateUser true, existing users still receive a link and sign in — no duplicate-email error.
 *
 * @param {string} email
 * @param {object} [options]
 * @returns {{ data, error }}
 */
export async function sendMagicLink(email, options = {}) {
  const trimmedEmail = email?.trim().toLowerCase();

  if (!options.allowAnyEmail && !isEduEmail(trimmedEmail)) {
    return {
      data: null,
      error: {
        message:
          "Only NMSU Main Campus (Las Cruces) @nmsu.edu addresses are allowed — not extension domains (e.g. dacc, alamogordo, grants, global).",
      },
    };
  }

  if (options.allowAnyEmail && !EMAIL_RE.test(trimmedEmail || "")) {
    return { data: null, error: { message: "Enter a valid email address." } };
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
  if (options.firstName || options.lastName || options.referralSource) {
    otpOptions.data = {
      first_name: options.firstName?.trim(),
      last_name: options.lastName?.trim(),
      /* Optional "how did you hear about us" — carried in auth metadata so the
         profile insert (Onboarding → createProfile) can persist it. */
      ...(options.referralSource && { referral_source: options.referralSource }),
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
// Easy Access Passcode (6-digit PIN via Supabase password)
// ──────────────────────────────────────────────────

export { validatePasscode };

/**
 * Sign in with email + 6-digit passcode. Available to every account type —
 * the passcode is a quick-login convenience set up in Settings after joining.
 * @param {string} email
 * @param {string} pin
 */
export async function signInWithPasscode(email, pin) {
  const trimmedEmail = email?.trim().toLowerCase();
  const validation = validatePasscode(pin);

  if (!EMAIL_RE.test(trimmedEmail || "")) {
    return { data: null, error: { message: "Enter a valid email address." } };
  }

  if (!validation.valid) {
    return { data: null, error: { message: validation.message } };
  }

  const trimmedPin = String(pin).trim();
  const authPassword = passcodeToAuthPassword(trimmedPin);

  let { data, error } = await supabase.auth.signInWithPassword({
    email: trimmedEmail,
    password: authPassword,
  });

  // Legacy accounts may have the raw 6-digit value stored before padding was added.
  if (error?.code === "invalid_credentials") {
    const legacy = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password: trimmedPin,
    });
    if (!legacy.error) {
      return { data: legacy.data, error: null };
    }
  }

  if (error) {
    return { data: null, error: { message: mapPasscodeAuthError(error, "signin"), code: error.code } };
  }

  return { data, error: null };
}

/**
 * Set or change the user's 6-digit passcode (requires active session).
 * @param {string} pin
 */
export async function setPasscode(pin) {
  const validation = validatePasscode(pin);
  if (!validation.valid) {
    return { data: null, error: { message: validation.message } };
  }

  const { data, error } = await supabase.auth.updateUser({
    password: passcodeToAuthPassword(pin),
  });

  if (error) {
    return { data: null, error: { message: mapPasscodeAuthError(error, "set"), code: error.code } };
  }

  // Session hygiene: changing the passcode signs out every OTHER device, so a
  // stolen/old session can't outlive a credential change. This device stays in.
  await supabase.auth.signOut({ scope: "others" }).catch(() => {});

  return { data, error: null };
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
