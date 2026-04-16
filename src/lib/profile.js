import { supabase } from "./supabase";
import { getLevel } from "../utils/helpers";

/** Flatten `user_private_contact` embed into the user object (PostgREST one-to-one). */
function mergeUserPrivateContact(userRow) {
  if (!userRow || typeof userRow !== "object") return userRow;
  const priv = userRow.user_private_contact;
  if (!priv || Array.isArray(priv)) {
    const { user_private_contact: _, ...rest } = userRow;
    return rest;
  }
  const { user_private_contact: _, ...rest } = userRow;
  return { ...rest, ...priv };
}

const USER_PRIVATE_SELECT =
  "email, phone, venmo, cashapp, paypal, snapchat, instagram, discord, zelle, apple_pay, google_pay, contact_favorite_keys";

/** 48h after gig completion (matches Postgres `interval '2 days'`). */
export const REVIEW_WINDOW_MS = 2 * 24 * 60 * 60 * 1000;

/** End of review window in ms since epoch; null if unknown. */
export function reviewWindowEndMs(gig) {
  const raw = gig?.completed_at ?? gig?.updated_at;
  if (raw == null || raw === "") return null;
  const ms = Date.parse(String(raw).trim());
  if (Number.isNaN(ms)) return null;
  return ms + REVIEW_WINDOW_MS;
}

export function isReviewWindowOpen(gig) {
  const end = reviewWindowEndMs(gig);
  if (end == null) return false;
  return Date.now() <= end;
}

// ──────────────────────────────────────────────────
// Get profile
// ──────────────────────────────────────────────────

export async function getMyProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { profile: null, error: { message: "Not authenticated" } };

  const { data, error } = await supabase
    .from("users")
    .select(`*, user_private_contact(${USER_PRIVATE_SELECT})`)
    .eq("id", user.id)
    .single();

  return { profile: mergeUserPrivateContact(data), error };
}

export async function getProfileById(userId) {
  const { data, error } = await supabase
    .from("users")
    .select(`*, user_private_contact(${USER_PRIVATE_SELECT})`)
    .eq("id", userId)
    .single();

  return { profile: mergeUserPrivateContact(data), error };
}

export async function getProfilesByIds(userIds) {
  if (!userIds.length) return {};
  const { data } = await supabase
    .from("users")
    .select("id, first_name, last_name, avatar_color, avatar_url")
    .in("id", userIds);

  const map = {};
  for (const u of data || []) {
    map[u.id] = u;
  }
  return map;
}

/** Single bundle for the public user profile page (React Query cache key per user). */
export async function getUserProfilePageData(userId) {
  const { profile: p } = await getProfileById(userId);
  if (!p) {
    return {
      profile: null,
      avatarUrl: null,
      reviews: [],
      userActivity: { postedGigs: [], completedGigs: [] },
      gigStats: { completed: 0, posted: 0 },
      rank: null,
      totalUsers: 0,
      myReviewsToThem: [],
      hasPendingReview: false,
      firstPendingGigId: null,
      eligiblePendingGigIds: [],
      hasExpiredReviewOpportunity: false,
    };
  }

  let avatarUrl = null;
  if (p.avatar_url) {
    const url = getAvatarUrl(p.avatar_url);
    if (url) avatarUrl = url;
  }

  const [reviewsRes, gigsRes, actRes, statsRes, rankRes, totalRes, myReviewsMap] = await Promise.all([
    getReviewsForUser(userId),
    getCompletedGigsBetweenUsers(userId),
    getUserActivity(userId),
    getUserGigStats(userId),
    getCampusRank(p.rep_score || 0),
    getTotalUsers(),
    getMyReviewsToUserByGig(userId),
  ]);

  const byGig = myReviewsMap.byGigId || {};
  const list = myReviewsMap.list || [];
  const sharedGigs = gigsRes.gigs || [];
  const pendingNoReview = sharedGigs.filter((g) => !byGig[g.id]);
  const eligiblePendingGigs = pendingNoReview.filter((g) => isReviewWindowOpen(g));
  const stalePending = pendingNoReview.filter((g) => !isReviewWindowOpen(g));

  return {
    profile: p,
    avatarUrl,
    reviews: reviewsRes.reviews || [],
    userActivity: actRes,
    gigStats: statsRes,
    rank: rankRes.rank,
    totalUsers: totalRes.total,
    myReviewsToThem: list,
    hasPendingReview: eligiblePendingGigs.length > 0,
    firstPendingGigId: eligiblePendingGigs[0]?.id ?? null,
    eligiblePendingGigIds: eligiblePendingGigs.map((g) => g.id),
    hasExpiredReviewOpportunity: stalePending.length > 0 && eligiblePendingGigs.length === 0,
  };
}

// ──────────────────────────────────────────────────
// Create profile (used during onboarding)
// ──────────────────────────────────────────────────

export async function createProfile({
  phone,
  firstName,
  lastName,
  email,
  venmo,
  cashapp,
  paypal,
  snapchat,
  instagram,
  discord,
  zelle,
  apple_pay,
  google_pay,
  avatarColor,
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { profile: null, error: { message: "Not authenticated" } };

  const userRow = {
    id: user.id,
    first_name: firstName,
    last_name: lastName,
    ...(avatarColor && { avatar_color: avatarColor }),
  };

  const { error } = await supabase.from("users").insert(userRow);
  if (error) return { profile: null, error };

  const contactRow = {
    user_id: user.id,
    email: email || user.email,
    phone,
    ...(venmo && { venmo }),
    ...(cashapp && { cashapp }),
    ...(paypal && { paypal }),
    ...(snapchat && { snapchat }),
    ...(instagram && { instagram }),
    ...(discord && { discord }),
    ...(zelle && { zelle }),
    ...(apple_pay && { apple_pay }),
    ...(google_pay && { google_pay }),
  };

  const { error: contactError } = await supabase.from("user_private_contact").insert(contactRow);
  if (contactError) return { profile: null, error: contactError };

  return getMyProfile();
}

// ──────────────────────────────────────────────────
// Update profile
// ──────────────────────────────────────────────────

const PRIVATE_USER_FIELDS = new Set([
  "phone",
  "email",
  "venmo",
  "cashapp",
  "paypal",
  "snapchat",
  "instagram",
  "discord",
  "zelle",
  "apple_pay",
  "google_pay",
  "contact_favorite_keys",
]);

export async function updateMyProfile(updates) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { profile: null, error: { message: "Not authenticated" } };

  const userPatch = {};
  const privatePatch = {};
  for (const [k, v] of Object.entries(updates)) {
    if (PRIVATE_USER_FIELDS.has(k)) {
      if (k === "phone") {
        privatePatch[k] = v;
      } else if (k === "contact_favorite_keys") {
        privatePatch[k] = v;
      } else {
        const t = v == null ? "" : String(v).trim();
        privatePatch[k] = t === "" ? null : t;
      }
    } else userPatch[k] = v;
  }

  if (Object.keys(userPatch).length > 0) {
    const { error: uErr } = await supabase.from("users").update(userPatch).eq("id", user.id);
    if (uErr) return { profile: null, error: uErr };
  }

  if (Object.keys(privatePatch).length > 0) {
    const { error: pErr } = await supabase
      .from("user_private_contact")
      .update(privatePatch)
      .eq("user_id", user.id);
    if (pErr) return { profile: null, error: pErr };
  }

  return getMyProfile();
}

// ──────────────────────────────────────────────────
// Account deletion (grace period — see Privacy / Settings)
// ──────────────────────────────────────────────────

export async function getMyDeletionRequest() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { request: null, error: { message: "Not authenticated" } };

  const { data, error } = await supabase
    .from("account_deletion_requests")
    .select("requested_at, grace_ends_at, status")
    .eq("user_id", user.id)
    .maybeSingle();

  return { request: data || null, error };
}

export async function requestAccountDeletion() {
  const { error } = await supabase.rpc("request_account_deletion");
  return { error };
}

/** Clears a pending scheduled deletion (e.g. after a fresh sign-in). Returns whether a row was cancelled. */
export async function cancelPendingAccountDeletion() {
  const { data, error } = await supabase.rpc("cancel_pending_account_deletion");
  return { cancelled: data === true, error };
}

// ──────────────────────────────────────────────────
// Profile stats (real data)
// ──────────────────────────────────────────────────

export async function getMyReviews() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { reviews: [], error: { message: "Not authenticated" } };

  const { data, error } = await supabase
    .from("reviews")
    .select("id, rating, text, created_at, reviewer_id, reviewer:reviewer_id(first_name, last_name, avatar_color, avatar_url)")
    .eq("reviewee_id", user.id)
    .order("created_at", { ascending: false });

  return { reviews: data || [], error };
}

export async function getMyGigStats() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { completed: 0, posted: 0, error: { message: "Not authenticated" } };

  const [takerRes, posterRes] = await Promise.all([
    supabase
      .from("gigs")
      .select("id", { count: "exact", head: true })
      .eq("taker_id", user.id)
      .eq("status", "completed"),
    supabase
      .from("gigs")
      .select("id", { count: "exact", head: true })
      .eq("poster_id", user.id),
  ]);

  return {
    completed: takerRes.count || 0,
    posted: posterRes.count || 0,
    error: takerRes.error || posterRes.error,
  };
}

export async function getUserGigStats(userId) {
  const [takerRes, posterRes] = await Promise.all([
    supabase
      .from("gigs")
      .select("id", { count: "exact", head: true })
      .eq("taker_id", userId)
      .eq("status", "completed"),
    supabase
      .from("gigs")
      .select("id", { count: "exact", head: true })
      .eq("poster_id", userId),
  ]);

  return {
    completed: takerRes.count || 0,
    posted: posterRes.count || 0,
    error: takerRes.error || posterRes.error,
  };
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

export async function getPublicStats() {
  const [totalRes, completedRes, usersRes] = await Promise.all([
    supabase.from("gigs").select("id", { count: "exact", head: true }),
    supabase.from("gigs").select("id", { count: "exact", head: true }).eq("status", "completed"),
    supabase.from("users").select("id", { count: "exact", head: true }),
  ]);

  return {
    totalPostings: totalRes.count || 0,
    completed: completedRes.count || 0,
    accounts: usersRes.count || 0,
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
      .select("id, title, description, price, status, created_at, updated_at, estimated_time, expires_at, category:category_id(label)")
      .eq("taker_id", user.id)
      .eq("status", "completed")
      .order("updated_at", { ascending: false })
      .limit(10),
    supabase
      .from("reviews")
      .select("id, rating, text, created_at, reviewer_id, reviewer:reviewer_id(first_name, last_name, avatar_color, avatar_url)")
      .eq("reviewee_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("gigs")
      .select("id, title, description, price, status, created_at, estimated_time, expires_at, category:category_id(label), taker:taker_id(first_name, last_name)")
      .eq("poster_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return {
    completedGigs: gigsRes.data || [],
    receivedReviews: reviewsRes.data || [],
    postedGigs: postedRes.data || [],
    error: gigsRes.error || reviewsRes.error || postedRes.error,
  };
}

// ──────────────────────────────────────────────────
// Reviews (for any user)
// ──────────────────────────────────────────────────

export async function getReviewsForUser(userId) {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, rating, text, created_at, reviewer_id, reviewer:reviewer_id(first_name, last_name, avatar_color, avatar_url)")
    .eq("reviewee_id", userId)
    .order("created_at", { ascending: false });

  return { reviews: data || [], error };
}

/**
 * Unified reports table (`reports`): subject_type `review` | `gig`.
 * UI can call this directly or use reportReview / reportGig helpers.
 */
export async function submitReport({ subjectType, reviewId, gigId, reason, details }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: { message: "Not authenticated" } };
  if (subjectType === "review" && !reviewId) {
    return { error: { message: "reviewId is required" } };
  }
  if (subjectType === "gig" && !gigId) {
    return { error: { message: "gigId is required" } };
  }

  const { error } = await supabase.from("reports").insert({
    subject_type: subjectType,
    review_id: subjectType === "review" ? reviewId : null,
    gig_id: subjectType === "gig" ? gigId : null,
    reporter_id: user.id,
    reason,
    details: details || null,
  });

  return { error };
}

export async function reportReview({ reviewId, reason, details }) {
  return submitReport({ subjectType: "review", reviewId, reason, details });
}

/** Same reasons/modal flow as reviews; wire Gig detail “Report” to this next. */
export async function reportGig({ gigId, reason, details }) {
  return submitReport({ subjectType: "gig", gigId, reason, details });
}

export async function submitReview({ gigId, revieweeId, rating, text }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { review: null, error: { message: "Not authenticated" } };
  if (!gigId) return { review: null, error: { message: "gigId is required" } };

  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("reviewer_id", user.id)
    .eq("gig_id", gigId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("reviews")
      .update({
        rating: Math.round(rating),
        text: text || null,
      })
      .eq("id", existing.id)
      .select()
      .single();
    return { review: data, error };
  }

  const row = {
    gig_id: gigId,
    reviewer_id: user.id,
    reviewee_id: revieweeId,
    rating: Math.round(rating),
    text: text || null,
  };

  const { data, error } = await supabase.from("reviews").insert(row).select().single();

  return { review: data, error };
}

export async function getCompletedGigsBetweenUsers(otherUserId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { gigs: [], error: { message: "Not authenticated" } };

  const { data, error } = await supabase
    .from("gigs")
    .select("id, title, completed_at, updated_at")
    .eq("status", "completed")
    .or(
      `and(poster_id.eq.${user.id},taker_id.eq.${otherUserId}),and(poster_id.eq.${otherUserId},taker_id.eq.${user.id})`
    )
    .order("updated_at", { ascending: false });

  return { gigs: data || [], error };
}

export async function getExistingReview(revieweeId, gigId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { review: null, error: { message: "Not authenticated" } };

  let q = supabase.from("reviews").select("id, rating, text").eq("reviewer_id", user.id).eq("reviewee_id", revieweeId);
  if (gigId) q = q.eq("gig_id", gigId);

  const { data, error } = await q.maybeSingle();

  return { review: data, error };
}

/** All reviews you wrote about `revieweeId`, keyed by gig_id (for mutual per-gig reviews). */
export async function getMyReviewsToUserByGig(revieweeId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { byGigId: {}, list: [], error: { message: "Not authenticated" } };

  const { data, error } = await supabase
    .from("reviews")
    .select("id, rating, text, gig_id, gig:gig_id(title)")
    .eq("reviewer_id", user.id)
    .eq("reviewee_id", revieweeId);

  const byGigId = {};
  const list = [];
  for (const r of data || []) {
    const gigTitle = r.gig && typeof r.gig === "object" && !Array.isArray(r.gig) ? r.gig.title : null;
    const row = {
      id: r.id,
      rating: r.rating,
      text: r.text,
      gig_id: r.gig_id,
      gig_title: gigTitle || "Gig",
    };
    if (r.gig_id) byGigId[r.gig_id] = row;
    list.push(row);
  }
  return { byGigId, list, error };
}

export async function deleteMyReview(reviewId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: { message: "Not authenticated" } };

  const { error } = await supabase.from("reviews").delete().eq("id", reviewId).eq("reviewer_id", user.id);

  return { error };
}

// ──────────────────────────────────────────────────
// Gigs (open feed + posting)
// ──────────────────────────────────────────────────

export async function getOpenGigs() {
  const nowIso = new Date().toISOString();
  // PostgREST splits on "." — ISO timestamps must be double-quoted or the filter matches nothing.
  const { data, error } = await supabase
    .from("gigs")
    .select(`
      id, title, description, price, location, estimated_time, expires_at, notes, status, created_at,
      category:category_id(label, icon_name),
      poster:poster_id(id, first_name, last_name, avatar_color, avatar_url, rep_score)
    `)
    .eq("status", "open")
    .or(`expires_at.is.null,expires_at.gt."${nowIso}"`)
    .order("created_at", { ascending: false });

  if (error || !data) return { gigs: data || [], error };

  const posterIds = [...new Set(data.map((g) => g.poster?.id).filter(Boolean))];
  let posterReviewMap = {};

  if (posterIds.length > 0) {
    const { data: allReviews } = await supabase
      .from("reviews")
      .select("reviewee_id, rating")
      .in("reviewee_id", posterIds);

    if (allReviews) {
      for (const r of allReviews) {
        if (!posterReviewMap[r.reviewee_id]) {
          posterReviewMap[r.reviewee_id] = { sum: 0, count: 0 };
        }
        posterReviewMap[r.reviewee_id].sum += r.rating;
        posterReviewMap[r.reviewee_id].count += 1;
      }
    }
  }

  const enriched = data.map((g) => ({
    ...g,
    _reviewStats: posterReviewMap[g.poster?.id] || null,
  }));

  return { gigs: enriched, error };
}

/**
 * Listing deadline in ms since epoch. Prefer gigs.expires_at (timestamptz);
 * falls back to legacy ISO strings stored in estimated_time.
 */
export function parseDeadline(gigOrTs) {
  let raw = null;
  if (gigOrTs != null && typeof gigOrTs === "object" && !Array.isArray(gigOrTs)) {
    raw = gigOrTs.expires_at ?? gigOrTs.estimated_time;
  } else {
    raw = gigOrTs;
  }
  if (raw == null || raw === "") return null;
  const ms = Date.parse(String(raw).trim());
  if (Number.isNaN(ms)) return null;
  return ms;
}

export function normalizeGig(g) {
  const poster = g.poster || {};
  const firstName = poster.first_name || "";
  const lastName = poster.last_name || "";
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const posterName = lastName ? `${firstName} ${lastName.charAt(0)}.` : firstName;
  const repScore = poster.rep_score || 0;
  const level = getLevel(repScore);

  const reviewStats = g._reviewStats;
  const posterAvgRating = reviewStats ? reviewStats.sum / reviewStats.count : 0;
  const posterReviewCount = reviewStats ? reviewStats.count : 0;

  const deadline = parseDeadline(g);
  const hasDeadline = deadline !== null;
  const etaRaw = g.estimated_time != null ? String(g.estimated_time).trim() : "";
  const eta = hasDeadline ? null : (etaRaw || "—");

  return {
    id: g.id,
    title: g.title,
    description: g.description || null,
    price: `$${Number(g.price).toFixed(2)}`,
    cat: g.category?.label || "Other",
    loc: g.location || "TBD",
    eta,
    deadline,
    status: g.status || "open",
    poster: posterName,
    posterId: poster.id,
    initials,
    color: poster.avatar_color || "#6366f1",
    avatarUrl: poster.avatar_url ? getAvatarUrl(poster.avatar_url) : null,
    levelLabel: level.label,
    posterAvgRating,
    posterReviewCount,
    postedAt: new Date(g.created_at).getTime(),
    notes: g.notes || "No additional notes.",
  };
}

export async function postNewGig({ title, description, categoryLabel, price, location, estimatedTime }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { gig: null, error: { message: "Not authenticated" } };

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: recentCount } = await supabase
    .from("gigs")
    .select("id", { count: "exact", head: true })
    .eq("poster_id", user.id)
    .gte("created_at", oneHourAgo);

  if (recentCount >= 5) {
    return { gig: null, error: { message: "You can only post 5 gigs per hour. Try again later." } };
  }

  const { data: cat } = await supabase
    .from("categories")
    .select("id")
    .eq("label", categoryLabel)
    .single();

  if (!cat) return { gig: null, error: { message: "Invalid category" } };

  const row = {
    poster_id: user.id,
    category_id: cat.id,
    title,
    price: price || 0,
    location,
  };
  if (description != null && String(description).trim() !== "") row.description = String(description).trim();
  if (estimatedTime) row.expires_at = estimatedTime;

  const { data, error } = await supabase
    .from("gigs")
    .insert(row)
    .select()
    .single();

  return { gig: data, error };
}

/** Poster-only; same window as delete — open or requested. Returns raw row for edit form. */
export async function getGigForPosterEdit(gigId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { gig: null, error: { message: "Not authenticated" } };

  const { data, error } = await supabase
    .from("gigs")
    .select("id, poster_id, title, description, price, location, expires_at, estimated_time, status, created_at, category:category_id(label)")
    .eq("id", gigId)
    .maybeSingle();

  if (error) return { gig: null, error };
  if (!data) return { gig: null, error: { message: "Gig not found" } };
  if (data.poster_id !== user.id) {
    return { gig: null, error: { message: "Only the poster can edit this gig." } };
  }
  if (data.status !== "open" && data.status !== "requested") {
    return { gig: null, error: { message: "You can only edit before someone accepts this gig." } };
  }
  return { gig: data, error: null };
}

/** Poster-only; allowed while status is open or requested (not active/completed). */
export async function updateMyGig(gigId, { title, description, categoryLabel, price, location, estimatedTime }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { gig: null, error: { message: "Not authenticated" } };

  const { data: gig, error: fetchErr } = await supabase
    .from("gigs")
    .select("id, poster_id, status")
    .eq("id", gigId)
    .maybeSingle();

  if (fetchErr) return { gig: null, error: fetchErr };
  if (!gig) return { gig: null, error: { message: "Gig not found" } };
  if (gig.poster_id !== user.id) {
    return { gig: null, error: { message: "Only the poster can update this gig." } };
  }
  if (gig.status !== "open" && gig.status !== "requested") {
    return { gig: null, error: { message: "You can only update before someone accepts this gig." } };
  }

  const { data: cat } = await supabase.from("categories").select("id").eq("label", categoryLabel).single();
  if (!cat) return { gig: null, error: { message: "Invalid category" } };

  const row = {
    title: String(title || "").trim(),
    price: price || 0,
    location: location != null ? String(location).trim() : null,
    category_id: cat.id,
  };
  if (description != null && String(description).trim() !== "") {
    row.description = String(description).trim();
  } else {
    row.description = null;
  }
  if (estimatedTime) {
    row.expires_at = estimatedTime;
  } else {
    row.expires_at = null;
  }

  const { data, error } = await supabase.from("gigs").update(row).eq("id", gigId).select().single();

  return { gig: data, error };
}

export async function getUserActivity(userId) {
  const [postedRes, completedRes] = await Promise.all([
    supabase
      .from("gigs")
      .select("id, title, description, status, created_at, estimated_time, expires_at, price, category:category_id(label), taker:taker_id(first_name, last_name)")
      .eq("poster_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("gigs")
      .select("id, title, description, price, status, created_at, updated_at, estimated_time, expires_at, category:category_id(label), poster:poster_id(first_name, last_name)")
      .eq("taker_id", userId)
      .eq("status", "completed")
      .order("updated_at", { ascending: false })
      .limit(10),
  ]);

  return {
    postedGigs: postedRes.data || [],
    completedGigs: completedRes.data || [],
    error: postedRes.error || completedRes.error,
  };
}

export async function getGigById(gigId) {
  const { data, error } = await supabase
    .from("gigs")
    .select(`
      id, title, description, price, location, estimated_time, expires_at, notes, status, created_at,
      category:category_id(label, icon_name),
      poster:poster_id(id, first_name, last_name, avatar_color, avatar_url, rep_score)
    `)
    .eq("id", gigId)
    .single();

  if (error || !data) return { gig: null, error };

  let _reviewStats = null;
  if (data.poster?.id) {
    const { data: reviews } = await supabase
      .from("reviews")
      .select("rating")
      .eq("reviewee_id", data.poster.id);
    if (reviews && reviews.length > 0) {
      const sum = reviews.reduce((s, r) => s + r.rating, 0);
      _reviewStats = { sum, count: reviews.length };
    }
  }

  return { gig: normalizeGig({ ...data, _reviewStats }), error: null };
}

// ──────────────────────────────────────────────────
// Gig Requests
// ──────────────────────────────────────────────────

export async function getMyRequestForGig(gigId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { request: null, error: null };

  const { data, error } = await supabase
    .from("gig_requests")
    .select("id, status")
    .eq("gig_id", gigId)
    .eq("requester_id", user.id)
    .maybeSingle();

  return { request: data || null, error };
}

export async function requestGig(gigId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { request: null, error: { message: "Not authenticated" } };

  const { data: rid, error } = await supabase.rpc("request_gig", { p_gig_id: gigId });
  if (error) return { request: null, error };

  const { data: req, error: fetchErr } = await supabase
    .from("gig_requests")
    .select("id, gig_id, requester_id, status, created_at")
    .eq("id", rid)
    .single();

  return { request: req, error: fetchErr };
}

export async function acceptGigRequest(requestId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: { message: "Not authenticated" } };

  const { error } = await supabase.rpc("accept_gig_request", { p_request_id: requestId });
  return { error };
}

export async function rejectGigRequest(requestId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: { message: "Not authenticated" } };

  const { error } = await supabase.rpc("reject_gig_request", { p_request_id: requestId });
  return { error };
}

export async function completeGig(gigId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: { message: "Not authenticated" } };

  const { error } = await supabase.rpc("complete_gig", { p_gig_id: gigId });
  return { error };
}

// ──────────────────────────────────────────────────
// Gig Detail (for alert detail modal)
// ──────────────────────────────────────────────────

export async function getGigDetail(gigId) {
  const { data: gig, error: gigError } = await supabase
    .from("gigs")
    .select(`
      id, title, description, price, location, estimated_time, expires_at, status, created_at, updated_at, completed_at,
      category:category_id(label),
      poster:poster_id(id, first_name, last_name, avatar_color, avatar_url, rep_score, user_private_contact(${USER_PRIVATE_SELECT})),
      taker:taker_id(id, first_name, last_name, avatar_color, avatar_url, rep_score, user_private_contact(${USER_PRIVATE_SELECT}))
    `)
    .eq("id", gigId)
    .single();

  if (gigError || !gig) return { gig: null, requests: [], error: gigError };

  const { data: requests } = await supabase
    .from("gig_requests")
    .select(`
      id, requester_id, status, created_at,
      requester:requester_id(id, first_name, last_name, avatar_color, avatar_url, rep_score, user_private_contact(${USER_PRIVATE_SELECT}))
    `)
    .eq("gig_id", gigId)
    .order("created_at", { ascending: false });

  const mergedGig = {
    ...gig,
    poster: mergeUserPrivateContact(gig.poster),
    taker: mergeUserPrivateContact(gig.taker),
  };
  const mergedReqs = (requests || []).map((r) => ({
    ...r,
    requester: mergeUserPrivateContact(r.requester),
  }));

  return { gig: mergedGig, requests: mergedReqs, error: null };
}

// ──────────────────────────────────────────────────
// Notifications
// ──────────────────────────────────────────────────

export async function getMyNotifications() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { notifications: [], error: { message: "Not authenticated" } };

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return { notifications: data || [], error };
}

export async function getUnreadNotificationCount() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { count: 0 };

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false);

  return { count: error ? 0 : (count || 0) };
}

export async function markAllNotificationsRead() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: { message: "Not authenticated" } };

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);

  return { error };
}

export async function markNotificationRead(notificationId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: { message: "Not authenticated" } };

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  return { error };
}

export async function deleteNotification(notificationId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: { message: "Not authenticated" } };

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .eq("user_id", user.id);

  return { error };
}

/** Poster-only; allowed while status is open or requested (not active/completed). */
export async function deleteMyGig(gigId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: { message: "Not authenticated" } };

  const { data: gig, error: fetchErr } = await supabase
    .from("gigs")
    .select("id, poster_id, status")
    .eq("id", gigId)
    .maybeSingle();

  if (fetchErr) return { error: fetchErr };
  if (!gig) return { error: { message: "Gig not found" } };
  if (gig.poster_id !== user.id) {
    return { error: { message: "Only the poster can delete this gig." } };
  }
  if (gig.status !== "open" && gig.status !== "requested") {
    return { error: { message: "You can only delete a gig before it’s accepted." } };
  }

  const { error } = await supabase.from("gigs").delete().eq("id", gigId);
  return { error };
}

export async function getGigStatusesForNotifications(gigIds) {
  if (!gigIds.length) return {};
  const { data } = await supabase
    .from("gigs")
    .select("id, status, expires_at")
    .in("id", gigIds);

  const map = {};
  for (const g of data || []) {
    map[g.id] = { status: g.status, expires_at: g.expires_at };
  }
  return map;
}

// ──────────────────────────────────────────────────
// Avatar (profile photo)
// ──────────────────────────────────────────────────

export async function uploadAvatar(file) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { path: null, error: { message: "Not authenticated" } };

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { path: null, error: uploadError };

  const { error: updateError } = await supabase
    .from("users")
    .update({ avatar_url: path })
    .eq("id", user.id);

  return { path, error: updateError };
}

export function getAvatarUrl(avatarPath) {
  if (!avatarPath) return null;
  const { data } = supabase.storage.from("avatars").getPublicUrl(avatarPath);
  return data?.publicUrl || null;
}

// ──────────────────────────────────────────────────
// Delete profile (and account)
// ──────────────────────────────────────────────────

export async function deleteMyProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: { message: "Not authenticated" } };

  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", user.id);

  return { error };
}
