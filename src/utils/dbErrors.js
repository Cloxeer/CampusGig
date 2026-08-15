/**
 * Maps raw Postgres/Supabase errors into user-friendly messages.
 *
 * The `user_private_contact` table has a UNIQUE index on every contact
 * handle (phone, email, and each payment/social key). A collision raises a
 * Postgres unique_violation (code 23505) whose default message leaks the
 * constraint name and the offending value — e.g.
 *   duplicate key value violates unique constraint "user_private_contact_phone_key"
 * We translate those into a plain-English sentence naming the field.
 */

// constraint / index name → friendly field label
const UNIQUE_CONSTRAINT_LABELS = {
  user_private_contact_phone_key: "phone number",
  user_private_contact_email_key: "email address",
  user_private_contact_venmo_key: "Venmo handle",
  user_private_contact_cashapp_key: "Cash App handle",
  user_private_contact_paypal_key: "PayPal",
  user_private_contact_snapchat_key: "Snapchat username",
  user_private_contact_instagram_key: "Instagram username",
  user_private_contact_discord_key: "Discord username",
  user_private_contact_zelle_key: "Zelle contact",
  user_private_contact_apple_pay_key: "Apple Pay contact",
  user_private_contact_google_pay_key: "Google Pay contact",
};

function friendlyDuplicateMessage(label) {
  return `That ${label} is already linked to another account. Each ${label} can only be used once — please use a different one.`;
}

/**
 * Returns a friendly message for a Supabase/Postgres error, or the original
 * message when we have nothing better. Safe to call with null/undefined.
 *
 * @param {{ code?: string, message?: string, details?: string, constraint?: string } | null | undefined} error
 * @returns {string}
 */
export function friendlyDbErrorMessage(error) {
  if (!error) return "Something went wrong. Please try again.";

  const code = error.code;
  const haystack = `${error.constraint || ""} ${error.message || ""} ${error.details || ""}`;

  // Unique violation (23505): find which contact field collided.
  if (code === "23505" || /duplicate key value|already exists/i.test(haystack)) {
    for (const [constraint, label] of Object.entries(UNIQUE_CONSTRAINT_LABELS)) {
      if (haystack.includes(constraint)) {
        return friendlyDuplicateMessage(label);
      }
    }
    // Unknown unique index — still avoid leaking the raw constraint text.
    return "That information is already linked to another account. Please use different details.";
  }

  return error.message || "Something went wrong. Please try again.";
}

/**
 * Wraps an error object so its `message` is the friendly version while
 * preserving `code` for callers that branch on it. Returns null for no error.
 */
export function toFriendlyError(error) {
  if (!error) return null;
  return { ...error, message: friendlyDbErrorMessage(error) };
}
