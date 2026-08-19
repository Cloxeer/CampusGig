import { useEffect, useState } from "react";

/**
 * Self-avatar registry — ONE source of truth for the CURRENT user's photo,
 * shared by every surface that draws your avatar (profile header, the
 * leaderboard's "you" row, gig cards you posted, the zoom modal, …).
 *
 * Why this exists: your avatar URL rides along inside many independent query
 * results (myProfile, leaderboard, gigs, reviews). Each is cached + refetched
 * separately, so after you change your photo only the query you invalidated
 * updates — every other surface keeps painting the OLD image until it happens
 * to refetch. That's the classic hole: one fact, drawn in two places, drifting.
 *
 * The registry closes it, mirroring `equippedRegistry` for borders/tags: the
 * upload path writes the freshest known URL here the instant it succeeds, and
 * the shared `UserAvatar` READS from here for the self row. So the moment you
 * save a new photo, every mounted self-avatar repaints — optimistically, with
 * no refetch and no per-screen patching.
 *
 * Only the CURRENT user flows through here (optimistic + server-stamped URL,
 * including the `?v=` cache token). Other users always read the URL embedded in
 * their own row — this registry never touches them.
 */

const EVT = "cg-self-avatar-changed";

/** Freshest-known resolved avatar URL for the current user, or null to fall
 *  back to whatever URL a row was handed. */
let selfAvatarUrl = null;

/** Record the current user's newest avatar URL (already resolved + versioned).
 *  No-op when unchanged so we never fire a needless avatar-wide re-render. */
export function setSelfAvatarUrl(url) {
  const next = url || null;
  if (next === selfAvatarUrl) return;
  selfAvatarUrl = next;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVT));
  }
}

export function getSelfAvatarUrl() {
  return selfAvatarUrl;
}

/**
 * Live self-avatar URL override. Pass `enabled` (i.e. "this row is me") — when
 * false it returns null so the caller keeps using the row's own URL. Re-renders
 * whenever a fresher self URL is set (e.g. right after an upload).
 */
export function useSelfAvatarUrl(enabled) {
  const [url, setUrl] = useState(() => (enabled ? selfAvatarUrl : null));
  useEffect(() => {
    if (!enabled) {
      setUrl(null);
      return undefined;
    }
    setUrl(selfAvatarUrl);
    const onChange = () => setUrl(selfAvatarUrl);
    window.addEventListener(EVT, onChange);
    return () => window.removeEventListener(EVT, onChange);
  }, [enabled]);
  return enabled ? url : null;
}
