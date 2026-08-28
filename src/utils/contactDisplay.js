import { emailFieldLabel } from "../lib/auth";
import {
  OPTIONAL_CONTACT_FIELD_KEYS,
  OPTIONAL_CONTACT_FIELD_BY_KEY,
  PAYMENT_CONTACT_KEYS,
} from "./contactFields";

export const CONTACT_MESSAGE_KEYS = ["phone", "email", "snapchat", "instagram", "discord"];
export const CONTACT_PAY_KEYS = ["cash", ...PAYMENT_CONTACT_KEYS];

const MESSAGE_KEY_SET = new Set(CONTACT_MESSAGE_KEYS);
const PAY_KEY_SET = new Set(CONTACT_PAY_KEYS);

function sortOptionalContactKeys(keys, favoriteKeys) {
  const fav = Array.isArray(favoriteKeys) ? favoriteKeys : [];
  return [...keys].sort((a, b) => {
    const ai = fav.indexOf(a);
    const bi = fav.indexOf(b);
    const aFav = ai >= 0;
    const bFav = bi >= 0;
    if (aFav && !bFav) return -1;
    if (!aFav && bFav) return 1;
    if (aFav && bFav) return ai - bi;
    return OPTIONAL_CONTACT_FIELD_KEYS.indexOf(a) - OPTIONAL_CONTACT_FIELD_KEYS.indexOf(b);
  });
}

function phoneHref(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length < 10) return null;
  return `tel:+${digits.length === 10 ? `1${digits}` : digits}`;
}

/**
 * Build read-only contact rows for gig detail reveal.
 * @returns {{ key: string, label: string, value: string, href?: string }[]}
 */
export function buildContactRows(user) {
  if (!user) return [];

  const rows = [];
  if (user.phone) {
    rows.push({
      key: "phone",
      label: "Phone",
      value: user.phone,
      href: phoneHref(user.phone),
    });
  }
  if (user.email) {
    rows.push({
      key: "email",
      label: emailFieldLabel(user.email),
      value: user.email,
      href: `mailto:${user.email}`,
    });
  }
  if (user.accepts_cash) {
    rows.push({ key: "cash", label: "Cash", value: "In person" });
  }

  const optionalKeys = sortOptionalContactKeys(
    OPTIONAL_CONTACT_FIELD_KEYS.filter((key) => user[key]),
    user.contact_favorite_keys
  );

  for (const key of optionalKeys) {
    const def = OPTIONAL_CONTACT_FIELD_BY_KEY[key];
    rows.push({ key, label: def?.label || key, value: user[key] });
  }

  return rows;
}

export function splitContactRows(rows) {
  return {
    message: rows.filter((row) => MESSAGE_KEY_SET.has(row.key)),
    pay: rows.filter((row) => PAY_KEY_SET.has(row.key)),
  };
}
