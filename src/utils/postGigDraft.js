/** Session-only draft for "Post a gig" (clears when the tab is closed). */

const KEY = "campusgig:post-draft:v1";

const CAT_LABELS = new Set(["Food", "Print", "Errand", "Notes", "Delivery", "Other"]);
const MAX_TIME_IDX = 6;

/**
 * @returns {{ cat: string, gigTitle: string, description: string, price: string, location: string, timeLimitIdx: number } | null}
 */
export function readDraft() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (!o || typeof o !== "object") return null;
    const { cat, gigTitle, description, price, location, timeLimitIdx } = o;
    if (typeof gigTitle !== "string" || typeof description !== "string") return null;
    if (typeof price !== "string" || typeof location !== "string") return null;
    if (typeof cat !== "string" || !CAT_LABELS.has(cat)) return null;
    if (
      typeof timeLimitIdx !== "number" ||
      !Number.isInteger(timeLimitIdx) ||
      timeLimitIdx < 0 ||
      timeLimitIdx > MAX_TIME_IDX
    ) {
      return null;
    }
    return { cat, gigTitle, description, price, location, timeLimitIdx };
  } catch {
    return null;
  }
}

/** @param {{ cat: string, gigTitle: string, description: string, price: string, location: string, timeLimitIdx: number }} draft */
export function writeDraft(draft) {
  if (!draft) return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearDraft() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore quota / private mode */
  }
}
