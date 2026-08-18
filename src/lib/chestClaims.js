/**
 * Chest claims — which rep-path thresholds have been opened.
 *
 * A local list is the synchronous cache the path reads (isChestClaimed); for a
 * signed-in user it is hydrated from and committed to Supabase:
 *   • openChest(threshold)        — server rolls + grants ONCE (no re-rolls) and
 *                                   returns the committed reward.
 *   • pickChestOption(t, id)      — settle a legendary "pick 1 of 3".
 *   • setClaimedChests(list)      — replace the cache from the server (hydrate).
 * Guests can't open real chests (they earn no rep), so the cache stays empty.
 */

import { supabase } from "./supabase";
import { getCurrentUid } from "./selfUid";

const KEY = "cg_chest_claims_v1";
const EVT = "cg-chests-changed";

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "null");
    if (Array.isArray(v)) return v.filter((n) => Number.isFinite(n));
  } catch {
    /* corrupt/blocked storage — start fresh */
  }
  return [];
}

function write(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* best-effort */
  }
  window.dispatchEvent(new Event(EVT));
}

/** @returns {number[]} claimed thresholds */
export function getClaimedChests() {
  return read();
}

export function isChestClaimed(targetRep) {
  return read().includes(targetRep);
}

/** Replace the local cache from the server (used by hydrateInventory). */
export function setClaimedChests(list) {
  write((Array.isArray(list) ? list : []).filter((n) => Number.isFinite(n)));
}

/** Mark a threshold opened in the local cache. */
export function claimChest(targetRep) {
  const list = read();
  if (!list.includes(targetRep)) {
    list.push(targetRep);
    write(list);
  }
  return list;
}

/**
 * Open a chest server-side (committed roll, no re-rolls). Returns the reward
 * jsonb: { status:'granted', cosmetic_id } | { status:'pending', options:[...] }.
 * Returns null for guests. Marks the threshold claimed locally on success.
 */
export async function openChest(targetRep) {
  if (!getCurrentUid()) return null;
  const { data, error } = await supabase.rpc("open_chest", { p_threshold: targetRep });
  if (error) return { error: error.message };
  claimChest(targetRep);
  return data;
}

/** Settle a legendary chest by keeping one option. Returns the final reward. */
export async function pickChestOption(targetRep, cosmeticId) {
  if (!getCurrentUid()) return null;
  const { data, error } = await supabase.rpc("pick_chest_option", { p_threshold: targetRep, p_cosmetic: cosmeticId });
  if (error) return { error: error.message };
  return data;
}

/** Live updates, same-window and cross-tab. Returns an unsubscribe fn. */
export function subscribeChests(fn) {
  const onStorage = (e) => {
    if (e.key === KEY || e.key === null) fn();
  };
  window.addEventListener(EVT, fn);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVT, fn);
    window.removeEventListener("storage", onStorage);
  };
}
