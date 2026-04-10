import { supabase } from "./supabase";
import { getLevel } from "../utils/helpers";

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
    .select("*")
    .eq("id", user.id)
    .single();

  return { profile: data, error };
}

export async function getProfileById(userId) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  return { profile: data, error };
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
  avatarColor,
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { profile: null, error: { message: "Not authenticated" } };

  const row = {
    id: user.id,
    first_name: firstName,
    last_name: lastName,
    email: email || user.email,
    phone,
    ...(venmo && { venmo }),
    ...(cashapp && { cashapp }),
    ...(paypal && { paypal }),
    ...(snapchat && { snapchat }),
    ...(avatarColor && { avatar_color: avatarColor }),
  };

  const { data, error } = await supabase
    .from("users")
    .insert(row)
    .select()
    .single();

  return { profile: data, error };
}

// ──────────────────────────────────────────────────
// Update profile
// ──────────────────────────────────────────────────

export async function updateMyProfile(updates) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { profile: null, error: { message: "Not authenticated" } };

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();

  return { profile: data, error };
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
    .select("id, rating, text, created_at, reviewer:reviewer_id(first_name, last_name, avatar_color)")
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
      .select("id, rating, text, created_at, reviewer:reviewer_id(first_name, last_name)")
      .eq("reviewee_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("gigs")
      .select("id, title, description, status, created_at, estimated_time, expires_at, category:category_id(label)")
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
    .select("id, rating, text, created_at, reviewer:reviewer_id(first_name, last_name, avatar_color)")
    .eq("reviewee_id", userId)
    .order("created_at", { ascending: false });

  return { reviews: data || [], error };
}

export async function submitReview({ gigId, revieweeId, rating, text }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { review: null, error: { message: "Not authenticated" } };

  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("reviewer_id", user.id)
    .eq("reviewee_id", revieweeId)
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
    reviewer_id: user.id,
    reviewee_id: revieweeId,
    rating: Math.round(rating),
    text: text || null,
  };
  if (gigId) row.gig_id = gigId;

  const { data, error } = await supabase
    .from("reviews")
    .insert(row)
    .select()
    .single();

  if (error?.message?.includes("not-null") && error.message.includes("gig_id")) {
    const rowNoGig = { ...row };
    delete rowNoGig.gig_id;
    const { data: d2, error: e2 } = await supabase
      .from("reviews")
      .insert(rowNoGig)
      .select()
      .single();
    return { review: d2, error: e2 };
  }

  return { review: data, error };
}

export async function getCompletedGigsBetweenUsers(otherUserId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { gigs: [], error: { message: "Not authenticated" } };

  const { data, error } = await supabase
    .from("gigs")
    .select("id, title")
    .eq("status", "completed")
    .or(
      `and(poster_id.eq.${user.id},taker_id.eq.${otherUserId}),and(poster_id.eq.${otherUserId},taker_id.eq.${user.id})`
    )
    .order("updated_at", { ascending: false });

  return { gigs: data || [], error };
}

export async function getExistingReview(revieweeId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { review: null, error: { message: "Not authenticated" } };

  const { data, error } = await supabase
    .from("reviews")
    .select("id, rating, text")
    .eq("reviewer_id", user.id)
    .eq("reviewee_id", revieweeId)
    .maybeSingle();

  return { review: data, error };
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

export async function getUserActivity(userId) {
  const [postedRes, completedRes] = await Promise.all([
    supabase
      .from("gigs")
      .select("id, title, description, status, created_at, estimated_time, expires_at, price, category:category_id(label)")
      .eq("poster_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("gigs")
      .select("id, title, description, price, status, created_at, updated_at, estimated_time, expires_at, category:category_id(label)")
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

function _userDisplayName(u) {
  if (!u) return "Someone";
  return u.last_name ? `${u.first_name} ${u.last_name.charAt(0)}.` : u.first_name || "Someone";
}

function _userInitials(u) {
  if (!u) return "?";
  return `${u.first_name?.charAt(0) || ""}${u.last_name?.charAt(0) || ""}`.toUpperCase();
}

function _buildNotifMeta(gig_id, request_id, requester_id, poster_id, role, otherUser) {
  return {
    gig_id,
    request_id,
    requester_id,
    poster_id,
    role,
    other_avatar_url: otherUser?.avatar_url ? getAvatarUrl(otherUser.avatar_url) : null,
    other_avatar_color: otherUser?.avatar_color || "#6366f1",
    other_initials: _userInitials(otherUser),
    other_name: _userDisplayName(otherUser),
  };
}

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

  const { data: gig } = await supabase
    .from("gigs")
    .select("id, poster_id, title, poster:poster_id(id, first_name, last_name, avatar_color, avatar_url)")
    .eq("id", gigId)
    .single();

  if (!gig) return { request: null, error: { message: "Gig not found" } };
  if (gig.poster_id === user.id) return { request: null, error: { message: "You cannot request your own gig" } };

  const { data: existing } = await supabase
    .from("gig_requests")
    .select("id")
    .eq("gig_id", gigId)
    .eq("requester_id", user.id)
    .maybeSingle();

  if (existing) return { request: existing, error: { message: "You already requested this gig" } };

  const { data, error } = await supabase
    .from("gig_requests")
    .insert({ gig_id: gigId, requester_id: user.id })
    .select()
    .single();

  if (error) return { request: null, error };

  const { data: me } = await supabase
    .from("users")
    .select("first_name, last_name, avatar_color, avatar_url")
    .eq("id", user.id)
    .single();

  const poster = gig.poster || {};
  const baseMeta = { gig_id: gigId, request_id: data.id, requester_id: user.id, poster_id: gig.poster_id };

  await supabase.from("notifications").insert({
    user_id: gig.poster_id,
    type: "gig_requested",
    title: `${_userDisplayName(me)} wants to take your gig`,
    body: gig.title,
    metadata: _buildNotifMeta(gigId, data.id, user.id, gig.poster_id, "poster", me),
  });

  await supabase.from("notifications").insert({
    user_id: user.id,
    type: "gig_request_sent",
    title: "You requested a gig",
    body: `${gig.title} · Waiting for ${_userDisplayName(poster)} to accept`,
    metadata: _buildNotifMeta(gigId, data.id, user.id, gig.poster_id, "requester", poster),
  });

  await supabase
    .from("gigs")
    .update({ status: "requested" })
    .eq("id", gigId)
    .eq("status", "open");

  return { request: data, error: null };
}

export async function acceptGigRequest(requestId, gigId, requesterId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: { message: "Not authenticated" } };

  const { error: reqError } = await supabase
    .from("gig_requests")
    .update({ status: "accepted" })
    .eq("id", requestId);
  if (reqError) return { error: reqError };

  const { error: gigError } = await supabase
    .from("gigs")
    .update({ taker_id: requesterId, status: "active" })
    .eq("id", gigId);
  if (gigError) return { error: gigError };

  const [gigRes, meRes, reqRes] = await Promise.all([
    supabase.from("gigs").select("title").eq("id", gigId).single(),
    supabase.from("users").select("first_name, last_name, avatar_color, avatar_url").eq("id", user.id).single(),
    supabase.from("users").select("first_name, last_name, avatar_color, avatar_url").eq("id", requesterId).single(),
  ]);

  const me = meRes.data;
  const requester = reqRes.data;
  const gigTitle = gigRes.data?.title || "Gig";

  await supabase.from("notifications").insert({
    user_id: requesterId,
    type: "gig_accepted",
    title: `${_userDisplayName(me)} accepted your request!`,
    body: `${gigTitle} · Tap to see contact info`,
    metadata: _buildNotifMeta(gigId, requestId, requesterId, user.id, "requester", me),
  });

  await supabase.from("notifications").insert({
    user_id: user.id,
    type: "gig_accepted",
    title: `You accepted ${_userDisplayName(requester)}'s request`,
    body: `${gigTitle} · Tap to see contact info`,
    metadata: _buildNotifMeta(gigId, requestId, requesterId, user.id, "poster", requester),
  });

  return { error: null };
}

export async function rejectGigRequest(requestId, gigId, requesterId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: { message: "Not authenticated" } };

  const { error: reqError } = await supabase
    .from("gig_requests")
    .update({ status: "rejected" })
    .eq("id", requestId);
  if (reqError) return { error: reqError };

  await supabase
    .from("gigs")
    .update({ status: "open" })
    .eq("id", gigId)
    .eq("status", "requested");

  const [gigRes, meRes] = await Promise.all([
    supabase.from("gigs").select("title").eq("id", gigId).single(),
    supabase.from("users").select("first_name, last_name, avatar_color, avatar_url").eq("id", user.id).single(),
  ]);

  await supabase.from("notifications").insert({
    user_id: requesterId,
    type: "gig_rejected",
    title: "Your gig request was declined",
    body: gigRes.data?.title || "The poster chose someone else",
    metadata: _buildNotifMeta(gigId, requestId, requesterId, user.id, "requester", meRes.data),
  });

  return { error: null };
}

export async function completeGig(gigId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: { message: "Not authenticated" } };

  const { data: gig } = await supabase
    .from("gigs")
    .select(`
      id, title, poster_id, taker_id,
      poster:poster_id(first_name, last_name, avatar_color, avatar_url),
      taker:taker_id(first_name, last_name, avatar_color, avatar_url)
    `)
    .eq("id", gigId)
    .single();

  if (!gig) return { error: { message: "Gig not found" } };
  if (gig.poster_id !== user.id) return { error: { message: "Only the poster can mark a gig as done" } };

  const { error } = await supabase
    .from("gigs")
    .update({ status: "completed" })
    .eq("id", gigId);
  if (error) return { error };

  if (gig.taker_id) {
    await supabase.from("notifications").insert({
      user_id: gig.taker_id,
      type: "gig_completed",
      title: "Gig completed! +10 Rep",
      body: `${gig.title} · ${_userDisplayName(gig.poster)} marked this as done`,
      metadata: _buildNotifMeta(gigId, null, gig.taker_id, gig.poster_id, "requester", gig.poster),
    });
  }

  await supabase.from("notifications").insert({
    user_id: user.id,
    type: "gig_completed",
    title: "Gig marked as done!",
    body: gig.title,
    metadata: _buildNotifMeta(gigId, null, gig.taker_id, gig.poster_id, "poster", gig.taker),
  });

  return { error: null };
}

// ──────────────────────────────────────────────────
// Gig Detail (for alert detail modal)
// ──────────────────────────────────────────────────

export async function getGigDetail(gigId) {
  const { data: gig, error: gigError } = await supabase
    .from("gigs")
    .select(`
      id, title, description, price, location, estimated_time, expires_at, status, created_at, updated_at,
      category:category_id(label),
      poster:poster_id(id, first_name, last_name, avatar_color, avatar_url, venmo, cashapp, snapchat, paypal, rep_score, phone),
      taker:taker_id(id, first_name, last_name, avatar_color, avatar_url, venmo, cashapp, snapchat, paypal, rep_score, phone)
    `)
    .eq("id", gigId)
    .single();

  if (gigError || !gig) return { gig: null, requests: [], error: gigError };

  const { data: requests } = await supabase
    .from("gig_requests")
    .select(`
      id, requester_id, status, created_at,
      requester:requester_id(id, first_name, last_name, avatar_color, avatar_url, venmo, cashapp, snapchat, paypal, rep_score, phone)
    `)
    .eq("gig_id", gigId)
    .order("created_at", { ascending: false });

  return { gig, requests: requests || [], error: null };
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
