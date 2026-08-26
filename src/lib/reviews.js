import { supabase } from "./supabase";
import { noteEquippedFromRow } from "./equippedRegistry";

/** Seed the shared equipped registry from a list of review rows' reviewers. */
function noteReviewers(rows) {
  for (const r of rows || []) noteEquippedFromRow(r.reviewer);
}

export async function getMyReviews() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { reviews: [], error: { message: "Not authenticated" } };

  const { data, error } = await supabase
    .from("reviews")
    .select("id, rating, text, created_at, reviewer_id, reviewer:reviewer_id(id, first_name, last_name, avatar_color, avatar_url, equipped_tag, equipped_border)")
    .eq("reviewee_id", user.id)
    .order("created_at", { ascending: false });

  noteReviewers(data);
  return { reviews: data || [], error };
}

export async function getReviewsForUser(userId) {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, rating, text, created_at, reviewer_id, reviewer:reviewer_id(id, first_name, last_name, avatar_color, avatar_url, equipped_tag, equipped_border)")
    .eq("reviewee_id", userId)
    .order("created_at", { ascending: false });

  noteReviewers(data);
  return { reviews: data || [], error };
}

const SUBJECT_ALIASES = {
  BugReport: "bug",
  SupportReport: "support",
};

const SAFETY_REASONS = new Set(["harassment", "spam", "false_info", "hate_speech", "inappropriate", "other"]);

/**
 * Unified reports: gig | review | user | bug | support.
 * UI may pass BugReport / SupportReport; those map to bug / support.
 */
export async function submitReport({ subjectType, reviewId, gigId, reportedUserId, reason, details }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: { message: "Not authenticated" } };

  const type = SUBJECT_ALIASES[subjectType] || subjectType;

  if (type === "support") {
    const contact = typeof reason === "string" ? reason.trim() : "";
    const body = typeof details === "string" ? details.trim() : "";
    if (!contact) return { error: { message: "Please add how we can reach you (email, @ on Discord, etc.)." } };
    if (!body) return { error: { message: "Please describe what you need help with." } };
    const { error } = await supabase.from("reports").insert({
      subject_type: "support",
      review_id: null,
      gig_id: null,
      reported_user_id: null,
      reporter_id: user.id,
      reason: contact.slice(0, 320),
      details: body.slice(0, 2000),
    });
    return { error };
  }

  if (type === "bug") {
    const page = typeof reason === "string" ? reason.trim() : "";
    const body = typeof details === "string" ? details.trim() : "";
    if (!page) return { error: { message: "Please choose where you saw the issue." } };
    if (!body) return { error: { message: "Please add a short description of what happened." } };
    const { error } = await supabase.from("reports").insert({
      subject_type: "bug",
      review_id: null,
      gig_id: null,
      reported_user_id: null,
      reporter_id: user.id,
      reason: page.slice(0, 200),
      details: body.slice(0, 2000),
    });
    return { error };
  }

  if (type === "review" && !reviewId) {
    return { error: { message: "reviewId is required" } };
  }
  if (type === "gig" && !gigId) {
    return { error: { message: "gigId is required" } };
  }
  if (type === "user" && !reportedUserId) {
    return { error: { message: "reportedUserId is required" } };
  }
  if (type === "user" && String(reportedUserId) === String(user.id)) {
    return { error: { message: "You cannot report yourself." } };
  }
  if (!SAFETY_REASONS.has(reason)) {
    return { error: { message: "Please choose a reason." } };
  }

  const { error } = await supabase.from("reports").insert({
    subject_type: type,
    review_id: type === "review" ? reviewId : null,
    gig_id: type === "gig" ? gigId : null,
    reported_user_id: type === "user" ? reportedUserId : null,
    reporter_id: user.id,
    reason,
    details: details || null,
  });

  return { error };
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
    const row = {
      id: r.id,
      rating: r.rating,
      text: r.text,
      gig_id: r.gig_id,
      gig_title: r.gig && typeof r.gig === "object" && !Array.isArray(r.gig) ? r.gig.title : "Gig",
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
