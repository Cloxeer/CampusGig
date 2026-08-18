import { supabase } from "./supabase";
import { getLevel } from "../utils/helpers";
import { getAvatarUrl } from "./avatar";
import { mergeUserPrivateContact, USER_PRIVATE_SELECT } from "./profileShared";
import { noteEquippedFromRow } from "./equippedRegistry";

const ONE_HOUR_MS = 60 * 60 * 1000;
/** Anti-spam cap on new gigs per poster per rolling hour. */
const MAX_GIGS_PER_HOUR = 5;

export async function getOpenGigs() {
  const nowIso = new Date().toISOString();
  // PostgREST splits on "." — ISO timestamps must be double-quoted or the filter matches nothing.
  const { data, error } = await supabase
    .from("gigs")
    .select(`
      id, title, description, price, location, estimated_time, expires_at, notes, status, created_at,
      category:category_id(label, icon_name),
      poster:poster_id(id, first_name, last_name, avatar_color, avatar_url, rep_score, account_type, equipped_tag, equipped_border)
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

  /* Seed the shared registry from these fresh poster rows. */
  for (const g of data) noteEquippedFromRow(g.poster);

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
    posterIsStudent: poster.account_type === "student",
    initials,
    color: poster.avatar_color || "#6366f1",
    avatarUrl: poster.avatar_url ? getAvatarUrl(poster.avatar_url) : null,
    /* Equipped cosmetics so the poster's tag + border show on the gig card,
       exactly as they do on the poster's own screen. */
    posterEquippedTag: poster.equipped_tag || null,
    posterEquippedBorder: poster.equipped_border || null,
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

  const oneHourAgo = new Date(Date.now() - ONE_HOUR_MS).toISOString();
  const { count: recentCount } = await supabase
    .from("gigs")
    .select("id", { count: "exact", head: true })
    .eq("poster_id", user.id)
    .gte("created_at", oneHourAgo);

  if (recentCount >= MAX_GIGS_PER_HOUR) {
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
  if (description != null && String(description).trim() !== "") row.description = String(description);
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
    row.description = String(description);
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

export async function getGigDetail(gigId) {
  const { data: gig, error: gigError } = await supabase
    .from("gigs")
    .select(`
      id, title, description, price, location, estimated_time, expires_at, status, created_at, updated_at, completed_at,
      category:category_id(label),
      poster:poster_id(id, first_name, last_name, avatar_color, avatar_url, rep_score, equipped_tag, equipped_border, user_private_contact(${USER_PRIVATE_SELECT})),
      taker:taker_id(id, first_name, last_name, avatar_color, avatar_url, rep_score, equipped_tag, equipped_border, user_private_contact(${USER_PRIVATE_SELECT}))
    `)
    .eq("id", gigId)
    .single();

  if (gigError || !gig) return { gig: null, requests: [], error: gigError };

  noteEquippedFromRow(gig.poster);
  noteEquippedFromRow(gig.taker);

  const { data: requests } = await supabase
    .from("gig_requests")
    .select(`
      id, requester_id, status, created_at,
      requester:requester_id(id, first_name, last_name, avatar_color, avatar_url, rep_score, equipped_tag, equipped_border, user_private_contact(${USER_PRIVATE_SELECT}))
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
  for (const r of requests || []) noteEquippedFromRow(r.requester);

  return { gig: mergedGig, requests: mergedReqs, error: null };
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
