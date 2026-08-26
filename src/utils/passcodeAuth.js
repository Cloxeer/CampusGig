/**
 * Maps the 6-digit UI passcode to the Supabase Auth password.
 * Supabase often requires 12+ characters; users only ever enter 6 digits.
 */
export function passcodeToAuthPassword(pin) {
  const digits = String(pin ?? "").trim();
  return `cg_passcode_v1:${digits}:nmsu`;
}

/**
 * Friendly errors for passcode save / sign-in via Supabase Auth.
 * @param {import('@supabase/supabase-js').AuthError | { message?: string; code?: string } | null | undefined} error
 * @param {'signin' | 'set'} context
 */
export function mapPasscodeAuthError(error, context = "signin") {
  const msg = (error?.message || "").toLowerCase();
  const code = error?.code;

  if (code === "invalid_credentials" || msg.includes("invalid login credentials")) {
    return "Incorrect email or PIN. Try again or use a magic link.";
  }
  if (msg.includes("email not confirmed")) {
    return "Confirm your email first, or sign in with a magic link.";
  }
  if (msg.includes("same password")) {
    return "Choose a different PIN than your current one.";
  }
  if (
    msg.includes("at least") &&
    (msg.includes("12") || msg.includes("8") || msg.includes("character"))
  ) {
    return context === "set"
      ? "Could not save your 6-digit PIN. Please try again."
      : "Could not sign in with this PIN. Try a magic link instead.";
  }
  if (
    msg.includes("weak") ||
    msg.includes("pwned") ||
    msg.includes("known") ||
    msg.includes("compromised") ||
    code === "weak_password"
  ) {
    return "This PIN is too easy to guess. Pick a different 6-digit PIN.";
  }

  return error?.message || (context === "set" ? "Could not save PIN." : "Could not sign in. Please try again.");
}
