import { supabase } from "./supabase";
import { OPTIONAL_CONTACT_FIELD_KEYS } from "../utils/contactFields";
import { mergeUserPrivateContact, USER_PRIVATE_SELECT, isReviewWindowOpen } from "./profileShared";
import { getAvatarUrl } from "./avatar";
import {
  getReviewsForUser,
  getCompletedGigsBetweenUsers,
  getMyReviewsToUserByGig,
} from "./reviews";
import { getUserActivity, getUserGigStats, getCampusRank, getTotalUsers } from "./rep";
import { toFriendlyError } from "../utils/dbErrors";

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
      gigStats: { completed: 0, posted: 0, posterCompleted: 0 },
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
    getCampusRank(p.rep_score || 0, p.created_at),
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
  if (contactError) return { profile: null, error: toFriendlyError(contactError) };

  return getMyProfile();
}

const PRIVATE_USER_FIELDS = new Set([
  "phone",
  "email",
  ...OPTIONAL_CONTACT_FIELD_KEYS,
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
    if (pErr) return { profile: null, error: toFriendlyError(pErr) };
  }

  return getMyProfile();
}

/** True when the user has configured a 6-digit easy access passcode. */
export function profileHasEasyAccessPasscode(profile) {
  return !!(profile?.has_easy_access_passcode || profile?.easy_access_passcode_set_at);
}

/**
 * Persist passcode state to Postgres (bcrypt hash + users flags) via RPC.
 * Call after supabase.auth.updateUser({ password }) succeeds.
 * @param {string} passcode - 6-digit PIN (sent over HTTPS; hashed server-side)
 */
export async function persistEasyAccessPasscode(passcode) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: { message: "Not authenticated" } };

  const { error } = await supabase.rpc("set_easy_access_passcode_record", {
    p_passcode: String(passcode).trim(),
  });

  if (error) {
    const { error: fallbackErr } = await updateMyProfile({
      has_easy_access_passcode: true,
      easy_access_passcode_set_at: new Date().toISOString(),
    });
    // RPC unavailable (migration not applied): flags-only fallback so UI still works.
    if (fallbackErr) return { error };
    return { error: null };
  }

  return { error: null };
}

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
