/**
 * Cosmetics inventory.
 *
 * A LOCAL cache (localStorage) is the synchronous read model every component
 * reads from (getInventory) — but for a signed-in user it is HYDRATED from and
 * WRITTEN THROUGH to Supabase, so ownership is real and server-authoritative:
 *
 *   • hydrateInventory()  — pull the server truth (get_my_inventory RPC) into
 *                           the cache on login / app start.
 *   • equip / unequip     — optimistic local update + equip_cosmetic /
 *                           unequip_cosmetic RPC (re-hydrates on failure).
 *   • collectCosmetic      — optimistic local reflect of a grant the server
 *                           already made (chest RPCs do the real grant).
 *
 * Guests (no session) run purely on the local cache with the starter tag.
 */

import { supabase } from "./supabase";
import { getCurrentUid } from "./selfUid";
import { STARTER_TAG_ID } from "../data/cosmetics";
import { setClaimedChests } from "./chestClaims";

const KEY = "cg_cosmetics_v1";
const EVT = "cg-cosmetics-changed";

/** Every account starts owning + wearing the "New" tier tag — the single source
 *  of truth for that default (server seeds the same via grant_starter). */
function starterState() {
  return { owned: [STARTER_TAG_ID], counts: { [STARTER_TAG_ID]: 1 }, equipped: { tag: STARTER_TAG_ID, border: null } };
}

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "null");
    if (v && Array.isArray(v.owned) && v.equipped && typeof v.equipped === "object") {
      const counts =
        v.counts && typeof v.counts === "object"
          ? v.counts
          : Object.fromEntries(v.owned.map((id) => [id, 1]));
      return {
        owned: v.owned,
        counts,
        equipped: { tag: v.equipped.tag ?? null, border: v.equipped.border ?? null },
      };
    }
  } catch {
    /* corrupt/blocked storage — fall through to the starter default */
  }
  return starterState();
}

function write(v) {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    /* storage full/blocked — inventory is best-effort */
  }
  window.dispatchEvent(new Event(EVT));
}

/** @returns {{ owned: string[], counts: Record<string, number>, equipped: { tag: string|null, border: string|null } }} */
export function getInventory() {
  return read();
}

/**
 * Pull the signed-in user's real inventory + equipped + chest claims from the
 * server into the local cache (one RPC round-trip). No-op for guests. Call on
 * app start and whenever auth changes.
 */
export async function hydrateInventory() {
  const { data, error } = await supabase.rpc("get_my_inventory");
  if (error || !data) return; // guest / not authenticated → keep local cache
  const owned = Object.keys(data.owned || {});
  const counts = data.owned || {};
  const equipped = { tag: data.equipped?.tag ?? null, border: data.equipped?.border ?? null };
  write({ owned, counts, equipped });
  if (Array.isArray(data.claims)) setClaimedChests(data.claims);
}

/* Keep the cache in sync with the signed-in user's server inventory: hydrate on
   load if a session exists, and on every sign-in. */
supabase.auth.getSession().then(({ data }) => {
  if (data?.session) hydrateInventory();
});
supabase.auth.onAuthStateChange((_event, session) => {
  if (session) hydrateInventory();
});

/** Register a DROP the server already granted (chest reward): optimistic local
 *  reflect so the UI updates instantly; the server row is the source of truth. */
export function collectCosmetic(id) {
  const v = read();
  if (!v.owned.includes(id)) v.owned.push(id);
  v.counts[id] = (v.counts[id] || 0) + 1;
  write(v);
  return v;
}

/** Wear it — one equipped slot per type. Optimistic local update + server RPC
 *  for signed-in users (re-hydrates to server truth if the RPC rejects). */
export function equipCosmetic(cosmetic) {
  const v = read();
  if (!v.owned.includes(cosmetic.id)) {
    v.owned.push(cosmetic.id);
    v.counts[cosmetic.id] = v.counts[cosmetic.id] || 1;
  }
  v.equipped[cosmetic.type] = cosmetic.id;
  write(v);
  if (getCurrentUid()) {
    supabase.rpc("equip_cosmetic", { p_cosmetic: cosmetic.id }).then(({ error }) => {
      if (error) hydrateInventory();
    });
  }
  return v;
}

export function unequipType(type) {
  const v = read();
  v.equipped[type] = null;
  write(v);
  if (getCurrentUid()) {
    supabase.rpc("unequip_cosmetic", { p_type: type }).then(({ error }) => {
      if (error) hydrateInventory();
    });
  }
  return v;
}

/** Re-render hook for live inventory updates — same-window AND cross-tab. */
export function subscribeInventory(fn) {
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
