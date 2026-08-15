import { supabase } from "./supabase";
import { getAvatarUrl } from "./avatar";

/** Most recent items returned for profile activity lists. */
const ACTIVITY_LIMIT = 10;

/** Completed-as-taker, total-posted, and completed-as-poster counts for one user. */
async function fetchGigStats(userId) {
  const [takerRes, posterRes, posterDoneRes] = await Promise.all([
    supabase
      .from("gigs")
      .select("id", { count: "exact", head: true })
      .eq("taker_id", userId)
      .eq("status", "completed"),
    supabase
      .from("gigs")
      .select("id", { count: "exact", head: true })
      .eq("poster_id", userId),
    supabase
      .from("gigs")
      .select("id", { count: "exact", head: true })
      .eq("poster_id", userId)
      .eq("status", "completed"),
  ]);

  return {
    completed: takerRes.count || 0,
    posted: posterRes.count || 0,
    posterCompleted: posterDoneRes.count || 0,
    error: takerRes.error || posterRes.error || posterDoneRes.error,
  };
}

export async function getMyGigStats() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { completed: 0, posted: 0, posterCompleted: 0, error: { message: "Not authenticated" } };

  return fetchGigStats(user.id);
}

export async function getUserGigStats(userId) {
  return fetchGigStats(userId);
}

export async function getCampusRank(repScore) {
  const { count, error } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .gt("rep_score", repScore);

  return { rank: (count || 0) + 1, error };
}

export async function getTotalUsers() {
  const { count, error } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true });

  return { total: count || 0, error };
}

const PUBLIC_STATS_CACHE_KEY = "cg_public_stats_v1";
/** De-dupes concurrent callers into one network request. */
let publicStatsInFlight = null;

function mapPublicStatsRow(row) {
  return {
    totalPostings: Number(row?.total_postings) || 0,
    completed: Number(row?.completed) || 0,
    accounts: Number(row?.accounts) || 0,
  };
}

function persistPublicStats(value) {
  try {
    localStorage.setItem(PUBLIC_STATS_CACHE_KEY, JSON.stringify({ t: Date.now(), v: value }));
  } catch {
    /* storage full/blocked — cache is best-effort */
  }
}

/** Last-known stats for instant first paint (may be stale; always revalidated). */
export function getCachedPublicStats() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PUBLIC_STATS_CACHE_KEY) || "null");
    return parsed?.v || null;
  } catch {
    return null;
  }
}

/**
 * Fresh marketing stats. Server-side this is a single-row read of a
 * trigger-maintained stats table (no live counting per visitor); the private
 * wrapper keeps anon away from row-level gig/user data (migration 20260814000001).
 */
export async function getPublicStats() {
  if (!publicStatsInFlight) {
    publicStatsInFlight = (async () => {
      const { data } = await supabase.rpc("get_public_stats");
      const row = Array.isArray(data) ? data[0] : data;
      const value = mapPublicStatsRow(row);
      persistPublicStats(value);
      return value;
    })().finally(() => {
      publicStatsInFlight = null;
    });
  }

  try {
    return await publicStatsInFlight;
  } catch {
    return getCachedPublicStats() || { totalPostings: 0, completed: 0, accounts: 0 };
  }
}

/**
 * Live stats: pushes a fresh value whenever the trigger-maintained
 * public_stats row changes (someone posts/completes a gig or joins).
 * Returns an unsubscribe function.
 * @param {(value: {totalPostings:number,completed:number,accounts:number}) => void} onChange
 */
export function subscribePublicStats(onChange) {
  const channel = supabase
    .channel("public-stats-live")
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "public_stats" },
      (payload) => {
        const value = mapPublicStatsRow(payload.new);
        persistPublicStats(value);
        onChange(value);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function getLeaderboard(limit = 10) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("users")
    .select("id, first_name, last_name, avatar_color, avatar_url, rep_score")
    .order("rep_score", { ascending: false })
    .limit(limit);

  const leaderboard = (data || []).map((u, i) => ({
    userId: u.id,
    rank: i + 1,
    name: `${u.first_name} ${u.last_name?.charAt(0)}.`,
    initials: `${u.first_name?.charAt(0) || ""}${u.last_name?.charAt(0) || ""}`.toUpperCase(),
    color: u.avatar_color || "#6366f1",
    avatarUrl: u.avatar_url ? getAvatarUrl(u.avatar_url) : null,
    rep: u.rep_score || 0,
    isYou: user?.id === u.id,
  }));

  return { leaderboard, error };
}

export async function getMyActivity() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { activity: [], error: { message: "Not authenticated" } };

  const [gigsRes, reviewsRes, postedRes] = await Promise.all([
    supabase
      .from("gigs")
      // completed_at is the immutable completion moment; updated_at moves on ANY
      // row update (e.g. migrations) and must never be used as an event time.
      .select("id, title, description, price, status, created_at, updated_at, completed_at, estimated_time, expires_at, category:category_id(label)")
      .eq("taker_id", user.id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false, nullsFirst: false })
      .limit(ACTIVITY_LIMIT),
    supabase
      .from("reviews")
      .select("id, rating, text, created_at, reviewer_id, reviewer:reviewer_id(first_name, last_name, avatar_color, avatar_url)")
      .eq("reviewee_id", user.id)
      .order("created_at", { ascending: false })
      .limit(ACTIVITY_LIMIT),
    supabase
      .from("gigs")
      .select("id, title, description, price, status, created_at, estimated_time, expires_at, category:category_id(label), taker:taker_id(first_name, last_name)")
      .eq("poster_id", user.id)
      .order("created_at", { ascending: false })
      .limit(ACTIVITY_LIMIT),
  ]);

  return {
    completedGigs: gigsRes.data || [],
    receivedReviews: reviewsRes.data || [],
    postedGigs: postedRes.data || [],
    error: gigsRes.error || reviewsRes.error || postedRes.error,
  };
}

export async function getUserActivity(userId) {
  const [postedRes, completedRes] = await Promise.all([
    supabase
      .from("gigs")
      .select("id, title, description, status, created_at, estimated_time, expires_at, price, category:category_id(label), taker:taker_id(first_name, last_name)")
      .eq("poster_id", userId)
      .order("created_at", { ascending: false })
      .limit(ACTIVITY_LIMIT),
    supabase
      .from("gigs")
      .select("id, title, description, price, status, created_at, updated_at, completed_at, estimated_time, expires_at, category:category_id(label), poster:poster_id(first_name, last_name)")
      .eq("taker_id", userId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false, nullsFirst: false })
      .limit(ACTIVITY_LIMIT),
  ]);

  return {
    postedGigs: postedRes.data || [],
    completedGigs: completedRes.data || [],
    error: postedRes.error || completedRes.error,
  };
}
