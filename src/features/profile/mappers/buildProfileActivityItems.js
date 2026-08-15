import { createElement } from "react";
import { CheckCircle, Star, Package, Timer } from "lucide-react";
import { parseDeadline } from "../../../lib/profile";

function titleSnip(title) {
  return `${title?.slice(0, 40)}${title?.length > 40 ? "…" : ""}`;
}

function takerName(g) {
  if (!g.taker) return null;
  return `${g.taker.first_name || ""} ${g.taker.last_name || ""}`.trim() || null;
}

function mapPostedGig(g, { perspective }) {
  const dl = parseDeadline(g);
  const isExpired = dl && dl < Date.now();
  const taker = takerName(g);
  const snip = titleSnip(g.title);

  let statusLabel;
  let subtitle;

  if (g.status === "completed" && taker) {
    statusLabel = perspective === "self" ? "Done" : "completed";
    subtitle = `${snip} · Done by ${taker}`;
  } else if (g.status === "active" && taker) {
    statusLabel = isExpired ? "Time ended" : perspective === "self" ? "Active" : "active";
    subtitle = `${snip} · Taken by ${taker}`;
  } else if (g.status === "active" && isExpired) {
    statusLabel = "Time ended";
    subtitle = `${snip} · Time ended`;
  } else if (g.status === "open" && isExpired) {
    statusLabel = perspective === "self" ? "Expired" : "Time ended";
    subtitle =
      perspective === "self"
        ? `${snip} · Expired — no takers`
        : `${snip} · Time ended`;
  } else {
    statusLabel = g.status === "open" ? (perspective === "self" ? "Open" : "open") : g.status;
    subtitle = `${snip} · ${statusLabel}`;
  }

  return {
    icon:
      isExpired && g.status !== "completed"
        ? createElement(Timer, { size: 15 })
        : createElement(Package, { size: 15 }),
    t: `${g.category?.label || "Gig"} posted`,
    s: subtitle,
    d: statusLabel,
    pos: g.status === "completed",
    expired: isExpired && g.status !== "completed",
    time: new Date(g.created_at).getTime(),
    gigId: g.id,
  };
}

function mapCompletedGig(g, { perspective }) {
  return {
    icon: createElement(CheckCircle, { size: 15 }),
    t: `${g.category?.label || "Gig"} completed`,
    s: `${titleSnip(g.title)} · $${Number(g.price).toFixed(2)}`,
    d: perspective === "self" ? "+10 pts" : "completed",
    pos: true,
    expired: false,
    // completed_at = immutable completion moment. updated_at moves on ANY row
    // update (e.g. migrations), so it must never be used as the event time.
    time: new Date(g.completed_at || g.updated_at).getTime(),
    gigId: g.id,
  };
}

function mapReceivedReview(r) {
  const rounded = Math.round(r.rating);
  const isZero = rounded === 0;
  return {
    icon: createElement(Star, { size: 15 }),
    t: `${r.rating}-star review received`,
    s: `From ${r.reviewer?.first_name || "User"} — "${r.text?.slice(0, 30)}${r.text?.length > 30 ? "…" : ""}"`,
    d: isZero ? "-10 pts" : `+${rounded} pts`,
    pos: !isZero,
    time: new Date(r.created_at).getTime(),
    gigId: null,
    reviewerId: r.reviewer_id || null,
  };
}

/**
 * @param {{ postedGigs?: array, completedGigs?: array, receivedReviews?: array }} activity
 * @param {{ perspective: 'self' | 'other' }} options
 */
export function buildActivityItems(activity, { perspective = "self" } = {}) {
  const posted = activity?.postedGigs ?? [];
  const completed = activity?.completedGigs ?? [];
  const reviews = perspective === "self" ? activity?.receivedReviews ?? [] : [];

  return [
    ...completed.map((g) => mapCompletedGig(g, { perspective })),
    ...reviews.map(mapReceivedReview),
    ...posted.map((g) => mapPostedGig(g, { perspective })),
  ].sort((a, b) => b.time - a.time);
}
