import { nanpDigitsFromInput } from "./phoneNanp";
import { EMPTY_CONTACT_PROFILE, OPTIONAL_CONTACT_FIELD_KEYS } from "./contactFields";

export { EMPTY_CONTACT_PROFILE };

export function trimOrNull(s) {
  const t = s != null ? String(s).trim() : "";
  return t === "" ? null : t;
}

export function validateNanpPhone(phone, { requiredMessage } = {}) {
  const phoneDigits = nanpDigitsFromInput(phone);
  if (!phoneDigits) {
    return { ok: false, error: requiredMessage || "Phone number is required." };
  }
  const nationalLen = phoneDigits[0] === "1" ? phoneDigits.length - 1 : phoneDigits.length;
  if (nationalLen !== 10) {
    return { ok: false, error: "Enter a valid 10-digit US phone number." };
  }
  return { ok: true, error: null };
}

export function validateAvatarFile(file) {
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "Please select an image file." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, error: "Image must be under 5 MB." };
  }
  return { ok: true, error: null };
}

export function profileContactsToApi(profile) {
  const out = {};
  for (const key of OPTIONAL_CONTACT_FIELD_KEYS) {
    out[key] = trimOrNull(profile[key]);
  }
  return out;
}

// Each contact handle is UNIQUE across accounts (user_private_contact_<key>_key).
// Map the raw Postgres unique-violation into something a person can act on,
// instead of leaking constraint names / column values to the UI.
const CONTACT_UNIQUE_MESSAGES = {
  phone: "This phone number is already in use.",
  email: "This email is already in use.",
  snapchat: "That Snapchat username is already linked to another account.",
  venmo: "That Venmo handle is already linked to another account.",
  cashapp: "That Cash App handle is already linked to another account.",
  paypal: "That PayPal is already linked to another account.",
  instagram: "That Instagram handle is already linked to another account.",
  discord: "That Discord is already linked to another account.",
  zelle: "That Zelle is already linked to another account.",
  apple_pay: "That Apple Pay is already linked to another account.",
  google_pay: "That Google Pay is already linked to another account.",
};

/**
 * Turn a Supabase/Postgres error from a profile write into friendly copy.
 * Falls back to the original message for anything we don't specifically handle.
 * @param {{code?: string, message?: string, details?: string}|null} error
 * @returns {string|null}
 */
export function mapContactError(error) {
  if (!error) return null;
  const raw = `${error.message || ""} ${error.details || ""}`.toLowerCase();
  const isUnique =
    error.code === "23505" || raw.includes("duplicate key") || raw.includes("already exists");

  if (isUnique) {
    for (const [key, msg] of Object.entries(CONTACT_UNIQUE_MESSAGES)) {
      // Match the constraint name (…_phone_key) or the details' "Key (phone)=…".
      if (raw.includes(`_${key}_key`) || raw.includes(`(${key})`)) return msg;
    }
    return "Some of your contact info is already in use by another account.";
  }

  return error.message || "Something went wrong.";
}
