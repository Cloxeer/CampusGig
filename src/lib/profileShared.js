import { OPTIONAL_CONTACT_FIELD_KEYS } from "../utils/contactFields";

/** Flatten `user_private_contact` embed into the user object (PostgREST one-to-one). */
export function mergeUserPrivateContact(userRow) {
  if (!userRow || typeof userRow !== "object") return userRow;
  const priv = userRow.user_private_contact;
  if (!priv || Array.isArray(priv)) {
    const { user_private_contact: _, ...rest } = userRow;
    return rest;
  }
  const { user_private_contact: _, ...rest } = userRow;
  return { ...rest, ...priv };
}

export const USER_PRIVATE_SELECT = [
  "email",
  "phone",
  ...OPTIONAL_CONTACT_FIELD_KEYS,
  "contact_favorite_keys",
  "accepts_cash",
].join(", ");

/** 48h after gig completion (matches Postgres `interval '2 days'`). */
export const REVIEW_WINDOW_MS = 2 * 24 * 60 * 60 * 1000;

/** End of review window in ms since epoch; null if unknown. */
export function reviewWindowEndMs(gig) {
  const raw = gig?.completed_at ?? gig?.updated_at;
  if (raw == null || raw === "") return null;
  const ms = Date.parse(String(raw).trim());
  if (Number.isNaN(ms)) return null;
  return ms + REVIEW_WINDOW_MS;
}

export function isReviewWindowOpen(gig) {
  const end = reviewWindowEndMs(gig);
  if (end == null) return false;
  return Date.now() <= end;
}
