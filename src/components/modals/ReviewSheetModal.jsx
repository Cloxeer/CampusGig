import { useEffect, useState, useMemo } from "react";
import { X, Star, Send, Loader, Flag } from "lucide-react";
import Stars from "../Stars";
import UserAvatar from "../UserAvatar";
import ReportModal from "./ReportModal";
import { submitReview } from "../../lib/profile";

export default function ReviewSheetModal({
  onClose,
  reviews = [],
  avgRating = 0,
  reviewCount = 0,
  isOwnProfile = false,
  currentUserId = null,
  revieweeId,
  pendingGigId = null,
  hasPendingReview = false,
  hasExpiredReviewOpportunity = false,
  myReviewsToThem = [],
  reviewForm = null,
  setReviewForm = () => {},
  onReviewSubmitted,
  targetReviewerId = null,
}) {
  const [newRating, setNewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [reportingReviewId, setReportingReviewId] = useState(null);

  const activeReview = useMemo(() => {
    if (reviewForm?.type !== "edit" || !reviewForm.reviewId) return null;
    return myReviewsToThem.find((r) => r.id === reviewForm.reviewId) || null;
  }, [reviewForm, myReviewsToThem]);

  const showComposer =
    !isOwnProfile && reviewForm && (reviewForm.type === "new" || reviewForm.type === "edit");

  const activeGigId =
    reviewForm?.type === "new"
      ? pendingGigId
      : reviewForm?.type === "edit"
        ? activeReview?.gig_id
        : null;

  useEffect(() => {
    if (reviewForm?.type === "edit" && reviewForm.reviewId) {
      const ar = myReviewsToThem.find((r) => r.id === reviewForm.reviewId);
      if (ar) {
        setNewRating(Number(ar.rating));
        setReviewText(ar.text || "");
        return;
      }
    }
    if (reviewForm?.type === "new") {
      setNewRating(0);
      setReviewText("");
      return;
    }
    if (!reviewForm) {
      setNewRating(0);
      setReviewText("");
    }
  }, [reviewForm?.type, reviewForm?.reviewId, myReviewsToThem]);

  const formatTime = (dateStr) => {
    const ms = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    return `${weeks}w ago`;
  };

  async function handleSubmit() {
    if (newRating === 0 || !revieweeId || !activeGigId) return;
    setSubmitting(true);
    setSubmitError(null);

    const { error } = await submitReview({
      gigId: activeGigId,
      revieweeId,
      rating: newRating,
      text: reviewText.trim() || null,
    });

    if (error) {
      const msg = error.message || "";
      if (/review window closed/i.test(msg)) {
        setSubmitError("The review window for this gig has closed.");
      } else if (msg.includes("not-null") || msg.includes("gig_id")) {
        setSubmitError("Complete a gig with this user before leaving a review.");
      } else {
        setSubmitError(msg || "Failed to submit review.");
      }
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setReviewForm(null);
    onReviewSubmitted?.();
  }

  const showPendingBanner = !isOwnProfile && !reviewForm && hasPendingReview;
  const showExpiredBanner =
    !isOwnProfile && !reviewForm && hasExpiredReviewOpportunity && !hasPendingReview;

  useEffect(() => {
    if (!targetReviewerId) return;
    const match = reviews.find((r) => String(r.reviewer_id || "") === String(targetReviewerId));
    if (!match) return;
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-review-id="${match.id}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }, [targetReviewerId, reviews]);

  const canReportReview = (r) =>
    Boolean(r?.id && currentUserId && String(r.reviewer_id || "") !== String(currentUserId));

  return (
    <>
      <div className="overlay overlay--reviews" onClick={onClose}>
        <div className="sheet sheet-full slidein" onClick={(e) => e.stopPropagation()}>
          <div className="handle" />

          <div
            style={{
              padding: "14px 20px 12px",
              borderBottom: "1px solid var(--bd)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-.02em", marginBottom: 3 }}>Reviews</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Stars rating={avgRating} size={14} />
                <span style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--mono)" }}>{avgRating.toFixed(1)}</span>
                <span style={{ fontSize: 12, color: "var(--fg3)" }}>
                  {reviewCount} review{reviewCount !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <button type="button" className="btn bg-btn bico" onClick={onClose}>
              <X size={15} />
            </button>
          </div>

          {showPendingBanner && (
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--bd)", background: "var(--bg2)", flexShrink: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>You completed a gig with them</div>
              <div style={{ fontSize: 12, color: "var(--fg3)", marginBottom: 10, lineHeight: 1.45 }}>
                Leave one review per completed gig within 48 hours of it being marked done. You can edit or delete your reviews from the profile card (settings) while the window is open.
              </div>
              <button type="button" className="btn bp bfull" onClick={() => setReviewForm({ type: "new" })}>
                Write a review
              </button>
            </div>
          )}

          {showExpiredBanner && (
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--bd)", background: "var(--bg3)", flexShrink: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Review window closed</div>
              <div style={{ fontSize: 12, color: "var(--fg3)", lineHeight: 1.45 }}>
                The 48-hour window to leave a review for this gig has ended. Not reviewing in time does not change your Rep.
              </div>
            </div>
          )}

          {showComposer && (
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--bd)", background: "var(--bg2)", flexShrink: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
                {reviewForm?.type === "edit" ? "Edit your review" : "Leave a review"}
              </div>
              {reviewForm?.type === "edit" && myReviewsToThem.length > 1 && (
                <select
                  className="ta"
                  style={{ width: "100%", marginBottom: 10, fontSize: 13, padding: "8px 10px", borderRadius: "var(--r)" }}
                  value={reviewForm.reviewId}
                  onChange={(e) => setReviewForm({ type: "edit", reviewId: e.target.value })}
                >
                  {myReviewsToThem.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.gig_title}
                    </option>
                  ))}
                </select>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 10 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    style={{
                      cursor: "pointer",
                      padding: 4,
                      display: "inline-flex",
                      background: "none",
                      border: "none",
                      WebkitTapHighlightColor: "transparent",
                      transition: "transform .1s",
                      transform: newRating === i ? "scale(1.15)" : "scale(1)",
                    }}
                    onClick={() => setNewRating(i)}
                  >
                    <Star
                      size={28}
                      fill={newRating >= i ? "#fbbf24" : "none"}
                      color={newRating >= i ? "#fbbf24" : "#d4d4d8"}
                      strokeWidth={1.5}
                    />
                  </button>
                ))}
                {newRating > 0 && (
                  <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--mono)", color: "#d97706", marginLeft: 6 }}>
                    {newRating}★
                  </span>
                )}
              </div>
              <textarea
                className="ta"
                style={{ minHeight: 60 }}
                placeholder="Share your experience…"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              />
              {submitError && (
                <div style={{ fontSize: 12, color: "var(--err)", fontFamily: "var(--mono)", marginTop: 6 }}>{submitError}</div>
              )}
              <button
                type="button"
                className="btn bp bfull"
                style={{ marginTop: 8, opacity: newRating === 0 || submitting || !activeGigId ? 0.6 : 1 }}
                disabled={newRating === 0 || submitting || !activeGigId}
                onClick={handleSubmit}
              >
                {submitting ? <Loader size={13} className="spin" /> : <Send size={13} />}
                {submitting ? "Submitting…" : reviewForm?.type === "edit" ? "Save" : "Submit"}
              </button>
            </div>
          )}

          <div style={{ flex: 1, overflowY: "auto" }}>
            {reviews.length === 0 && (
              <div
                style={{
                  padding: "32px 20px",
                  textAlign: "center",
                  color: "var(--fg4)",
                  fontSize: 13,
                  fontFamily: "var(--mono)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: 1,
                  minHeight: 200,
                }}
              >
                No reviews yet.
              </div>
            )}

            {reviews.map((r, i) => {
              const reviewer = r.reviewer || {};
              return (
                <div
                  key={r.id || i}
                  className="rev-row"
                  data-review-id={r.id || ""}
                  style={
                    String(r.reviewer_id || "") === String(targetReviewerId || "")
                      ? { background: "var(--green-bg)", border: "1px solid var(--green-bd)", borderRadius: "var(--r)" }
                      : undefined
                  }
                >
                  <UserAvatar user={reviewer} size={34} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>
                        {reviewer.first_name || "User"} {reviewer.last_name?.charAt(0) || ""}.
                      </span>
                      <Stars rating={r.rating} size={11} />
                    </div>
                    <div style={{ fontSize: 13, color: "var(--fg2)", lineHeight: 1.5 }}>{r.text}</div>
                    <div style={{ fontSize: 11, color: "var(--fg4)", fontFamily: "var(--mono)", marginTop: 3 }}>
                      {formatTime(r.created_at)}
                    </div>
                  </div>
                  {canReportReview(r) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReportingReviewId(r.id);
                      }}
                      className="rev-flag"
                      aria-label="Report review"
                    >
                      <Flag size={13} strokeWidth={1.75} />
                    </button>
                  )}
                </div>
              );
            })}
            <div style={{ height: 16 }} />
          </div>
        </div>
      </div>
    {reportingReviewId && (
      <ReportModal subjectType="review" reviewId={reportingReviewId} onClose={() => setReportingReviewId(null)} />
    )}
    </>
  );
}
