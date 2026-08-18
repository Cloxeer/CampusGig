import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

/**
 * localStorage persister for the React Query cache.
 *
 * This is the single, app-wide "boot from saved data, refresh in the background"
 * switch. Every page that reads through the shared queryClient (Home, Profile,
 * Alerts, Settings, …) gets instant paint on reload for free — no per-page code.
 *
 * `buster` invalidates the whole persisted cache when the shape of what we cache
 * changes (bump it on breaking query changes). `maxAge` drops anything older than
 * 24h so a user returning days later doesn't hydrate very stale data.
 */
/* v2: cached user/gig/leaderboard/review rows now carry equipped_tag +
   equipped_border so other users' cosmetics render everywhere — old cached
   rows lack those fields, so drop them and refetch. */
export const PERSIST_BUSTER = "v2";
export const PERSIST_MAX_AGE = 24 * 60 * 60 * 1000; // 24h

export const queryPersister = createSyncStoragePersister({
  storage: typeof window !== "undefined" ? window.localStorage : undefined,
  key: "campusgig-rq-cache",
});
