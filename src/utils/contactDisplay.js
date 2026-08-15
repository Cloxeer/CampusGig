import {
  OPTIONAL_CONTACT_FIELD_KEYS,
  OPTIONAL_CONTACT_FIELD_BY_KEY,
} from "./contactFields";

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

/**
 * Build read-only contact rows for gig detail reveal.
 * @returns {{ key: string, label: string, value: string }[]}
 */
export function buildContactRows(user) {
  if (!user) return [];

  const rows = [];
  if (user.phone) rows.push({ key: "phone", label: "Phone", value: user.phone });
  if (user.email) rows.push({ key: "email", label: "School email", value: user.email });

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
