/** Session-only draft for "Post a gig" (clears when the tab is closed). */

import { CATEGORY_LABELS } from "../data/categories";

/* v2: category labels changed (Delivery/Errands/Academics/Creative/Other) and
   drafts now carry the remote flag, so old v1 drafts are simply ignored. */
const KEY = "campusgig:post-draft:v2";

const CAT_LABELS = new Set(CATEGORY_LABELS);
const MAX_TIME_IDX = 6;

/**
 * @returns {{ cat: string, gigTitle: string, description: string, price: string, location: string, timeLimitIdx: number, remote: boolean } | null}
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
    return { cat, gigTitle, description, price, location, timeLimitIdx, remote: o.remote === true };
  } catch {
    return null;
  }
}

/** @param {{ cat: string, gigTitle: string, description: string, price: string, location: string, timeLimitIdx: number, remote: boolean }} draft */
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
