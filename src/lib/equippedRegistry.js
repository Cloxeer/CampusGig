import { useEffect, useState } from "react";

/**
 * Equipped-cosmetics registry — ONE source of truth for "what tag/border is
 * user X wearing", shared by every surface that draws an avatar or a tag.
 *
 * Why this exists: a user's equipped_tag / equipped_border ride along inside
 * many independent query results (leaderboard, profile, gig cards, gig detail,
 * reviews). Each of those is cached + persisted separately, so two surfaces
 * showing the SAME person can disagree when one cache is staler than the other
 * (e.g. the leaderboard row says "New" while their profile says "Caffeine Based
 * Lifeform"). That's the classic hole: one fact, drawn in two places, drifting.
 *
 * The registry closes it. Data loaders call `noteEquipped()` the moment they
 * FETCH a fresh value; the shared components (UserAvatar, LevelBadge) READ from
 * here by userId. So whenever any query pulls a newer value for a user, every
 * mounted surface for that user re-renders to match — one edit, everywhere.
 *
 * Seeded ONLY from real fetches (inside queryFns), never from cache reads or
 * component renders, so a stale persisted row can't overwrite a fresh value —
 * the freshest fetch this session has seen always wins.
 *
 * The CURRENT user is handled separately: UserAvatar/LevelBadge read their own
 * equipped set from the live local inventory (optimistic + server-hydrated), so
 * your own equips paint instantly across the whole site without a round-trip.
 */

const EVT = "cg-equipped-changed";

/** userId -> { tag: string|null, border: string|null } */
const equippedByUser = new Map();

/** Record the freshest-known equipped set for a user. No-op when unchanged, so
 *  we never fire a needless re-render storm across every avatar on screen. */
export function noteEquipped(userId, tag, border) {
  if (!userId) return;
  const next = { tag: tag ?? null, border: border ?? null };
  const prev = equippedByUser.get(userId);
  if (prev && prev.tag === next.tag && prev.border === next.border) return;
  equippedByUser.set(userId, next);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVT, { detail: { userId } }));
  }
}

/** Convenience: note a whole users-shaped row ({ id, equipped_tag, equipped_border }). */
export function noteEquippedFromRow(row) {
  if (row?.id) noteEquipped(row.id, row.equipped_tag, row.equipped_border);
}

export function getEquipped(userId) {
  return (userId && equippedByUser.get(userId)) || null;
}

export function subscribeEquipped(fn) {
  window.addEventListener(EVT, fn);
  return () => window.removeEventListener(EVT, fn);
}

/**
 * Live equipped set for a user (or null to disable, e.g. for the current user
 * who reads local inventory instead). Re-renders when a fresher value arrives.
 */
export function useRegisteredEquipped(userId) {
  const [val, setVal] = useState(() => getEquipped(userId));
  useEffect(() => {
    if (!userId) {
      setVal(null);
      return undefined;
    }
    setVal(getEquipped(userId));
    return subscribeEquipped((e) => {
      if (!e.detail || e.detail.userId === userId) setVal(getEquipped(userId));
    });
  }, [userId]);
  return userId ? val : null;
}
