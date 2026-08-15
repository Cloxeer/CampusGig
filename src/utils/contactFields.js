/**
 * Single source of truth for optional contact fields.
 * Drives the edit form (prefix / placeholder / formLabel), the favorites system,
 * the empty form profile, and the read-only reveal display (label).
 */
export const POPULAR_CONTACT_FIELDS = [
  { key: "venmo", label: "Venmo", prefix: "@", placeholder: "yourvenmo" },
  { key: "cashapp", label: "Cash App", prefix: "$", placeholder: "yourcashtag" },
  { key: "paypal", label: "PayPal", icon: "at", placeholder: "email or @handle" },
];

export const MORE_CONTACT_FIELDS = [
  { key: "snapchat", label: "Snapchat", prefix: "@", placeholder: "username" },
  { key: "instagram", label: "Instagram", prefix: "@", placeholder: "username" },
  { key: "discord", label: "Discord", prefix: "#", placeholder: "username or user#0000" },
  { key: "zelle", label: "Zelle", prefix: "Z", placeholder: "email or phone for Zelle" },
  { key: "apple_pay", label: "Apple Pay", formLabel: "Apple Pay / Apple Cash", prefix: "A", placeholder: "phone or Apple ID email" },
  { key: "google_pay", label: "Google Pay", prefix: "G", placeholder: "email or phone" },
];

export const OPTIONAL_CONTACT_FIELD_KEYS = [
  ...POPULAR_CONTACT_FIELDS,
  ...MORE_CONTACT_FIELDS,
].map((f) => f.key);

export const OPTIONAL_CONTACT_FIELD_BY_KEY = Object.fromEntries(
  [...POPULAR_CONTACT_FIELDS, ...MORE_CONTACT_FIELDS].map((f) => [f.key, f])
);

/** Keys that can be starred and reordered for display to others. */
export const FAVORABLE_CONTACT_KEYS = OPTIONAL_CONTACT_FIELD_KEYS;

const validFavoriteKey = new Set(FAVORABLE_CONTACT_KEYS);

export function normalizeContactFavoriteKeys(arr) {
  const seen = new Set();
  const out = [];
  for (const k of arr || []) {
    if (!validFavoriteKey.has(k) || seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}

/** All editable contact keys persisted to `user_private_contact` (phone first). */
export const CONTACT_PROFILE_KEYS = ["phone", ...OPTIONAL_CONTACT_FIELD_KEYS];

/** Blank editable contact profile for new / reset forms. */
export const EMPTY_CONTACT_PROFILE = Object.fromEntries(
  CONTACT_PROFILE_KEYS.map((k) => [k, ""])
);
