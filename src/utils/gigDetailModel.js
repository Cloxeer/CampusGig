import { countdown } from "./helpers";
import { getLevel } from "./helpers";

/**
 * Quest-flow phases for gig detail UI.
 * @typedef {'discover' | 'awaiting' | 'active' | 'done' | 'poster_open'} GigDetailPhase
 */

/**
 * @param {{
 *   gig: object,
 *   requests?: array,
 *   currentUserId?: string,
 *   existingRequest?: { status?: string } | null,
 *   notificationMeta?: object,
 *   requestedLocally?: boolean,
 * }} input
 */
export function deriveGigDetailView({
  gig,
  requests = [],
  currentUserId,
  existingRequest = null,
  notificationMeta = {},
  requestedLocally = false,
}) {
  const poster = gig.poster || {};
  const taker = gig.taker || null;
  const pendingReq = requests.find((r) => r.status === "pending") || null;
  const acceptedReq = requests.find((r) => r.status === "accepted") || null;
  const requesterUser = taker || pendingReq?.requester || acceptedReq?.requester || null;

  const expired = Boolean(gig.expires_at && new Date(gig.expires_at) < new Date());
  const isActive = gig.status === "active";
  const isCompleted = gig.status === "completed";
  const hasPendingRequest = Boolean(pendingReq);
  const isOwnGig = Boolean(currentUserId && poster.id && poster.id === currentUserId);

  const role =
    notificationMeta.role ||
    (currentUserId ? (poster.id === currentUserId ? "poster" : "requester") : null);

  let effectiveStatus = gig.status;
  if (hasPendingRequest && gig.status === "open") effectiveStatus = "requested";

  const userRequestStatus = existingRequest?.status || null;
  const showAlreadyRequested =
    requestedLocally ||
    userRequestStatus === "pending" ||
    userRequestStatus === "accepted";
  const showRejected = userRequestStatus === "rejected";

  const showContactInfo = isActive || isCompleted;
  const showPaymentLockCallout = !showContactInfo && !isCompleted;

  let phase = "discover";
  if (isCompleted) phase = "done";
  else if (isActive) phase = "active";
  else if (isOwnGig && gig.status === "open" && !hasPendingRequest) phase = "poster_open";
  else if (
    hasPendingRequest ||
    userRequestStatus === "pending" ||
    (userRequestStatus === "accepted" && !isActive)
  ) {
    phase = "awaiting";
  } else if (!isOwnGig && gig.status === "open") {
    phase = "discover";
  } else if (isOwnGig) {
    phase = "poster_open";
  }

  const revieweeForReview =
    currentUserId && poster.id && taker?.id
      ? currentUserId === poster.id
        ? taker.id
        : currentUserId === taker.id
          ? poster.id
          : null
      : null;

  const posterName =
    `${poster.first_name || ""} ${(poster.last_name || "").charAt(0)}.`.trim() || "Poster";

  return {
    phase,
    role,
    poster,
    taker,
    requesterUser,
    pendingReq,
    isOwnGig,
    canPosterDelete: Boolean(isOwnGig && (gig.status === "open" || gig.status === "requested")),
    canReport: phase === "discover" && Boolean(currentUserId),
    expired,
    isActive,
    isCompleted,
    hasPendingRequest,
    effectiveStatus,
    showContactInfo,
    showPaymentLockCallout,
    showAlreadyRequested,
    showRejected,
    revieweeForReview,
    posterName,
    posterLevel: getLevel(poster.rep_score || 0),
    priceDisplay: `$${Number(gig.price).toFixed(2)}`,
    taskDesc: gig.description || "No additional details.",
    countdown: gig.expires_at ? countdown(new Date(gig.expires_at).getTime()) : null,
    estimatedTime: gig.estimated_time != null ? String(gig.estimated_time).trim() : null,
    categoryLabel: gig.category?.label || "Gig",
    requesterLabel: isCompleted ? "Completed" : isActive ? "Taking" : "Requested",
    showNoRequestersYet: !requesterUser && (gig.status === "open" || gig.status === "requested") && !hasPendingRequest,
  };
}
