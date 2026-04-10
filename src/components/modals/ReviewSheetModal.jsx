import { useState } from "react";
import { X, Star, Send, Loader } from "lucide-react";
import Stars from "../Stars";
import { submitReview } from "../../lib/profile";

export default function ReviewSheetModal({
  onClose,
  reviews = [],
  avgRating = 0,
  reviewCount = 0,
  isOwnProfile = false,
  revieweeId,
  gigId,
  canReview = false,
  alreadyReviewed = false,
  onReviewSubmitted,
}) {
  const [newRating, setNewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

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
    if (newRating === 0 || !gigId || !revieweeId) return;
    setSubmitting(true);
    setSubmitError(null);

    const { error } = await submitReview({
      gigId,
      revieweeId,
      rating: newRating,
      text: reviewText.trim() || null,
    });

    if (error) {
      setSubmitError(error.message || "Failed to submit review.");
      setSubmitting(false);
      return;
    }

    setNewRating(0);
    setReviewText("");
    setSubmitting(false);
    onReviewSubmitted?.();
  }

  const showReviewForm = !isOwnProfile && canReview && !alreadyReviewed;

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="sheet sheet-full slidein"
        onClick={(e) => e.stopPropagation()}
      >
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
              <span style={{ fontSize: 12, color: "var(--fg3)" }}>{reviewCount} review{reviewCount !== 1 ? "s" : ""}</span>
            </div>
          </div>
          <button className="btn bg-btn bico" onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        {showReviewForm && (
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--bd)", background: "var(--bg2)", flexShrink: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Leave a review</div>
            <div style={{ display: "flex", alignItems: "center", gap: 2, marginBottom: 10 }}>
              {[1, 2, 3, 4, 5].map((i) => {
                const isFull = newRating >= i;
                const isHalf = !isFull && newRating >= i - 0.5;

                return (
                  <div
                    key={i}
                    style={{ cursor: "pointer", padding: 2, position: "relative", display: "inline-flex" }}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      setNewRating(x < rect.width / 2 ? i - 0.5 : i);
                    }}
                  >
                    {isFull && (
                      <Star size={24} fill="#fbbf24" color="#fbbf24" strokeWidth={1.5} />
                    )}
                    {isHalf && (
                      <span style={{ position: "relative", display: "inline-flex", width: 24, height: 24 }}>
                        <Star size={24} fill="none" color="#d4d4d8" strokeWidth={1.5} />
                        <span style={{ position: "absolute", top: 0, left: 0, width: "50%", height: "100%", overflow: "hidden" }}>
                          <Star size={24} fill="#fbbf24" color="#fbbf24" strokeWidth={1.5} style={{ minWidth: 24 }} />
                        </span>
                      </span>
                    )}
                    {!isFull && !isHalf && (
                      <Star size={24} fill="none" color="#d4d4d8" strokeWidth={1.5} />
                    )}
                  </div>
                );
              })}
              {newRating > 0 && (
                <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--mono)", color: "#d97706", marginLeft: 6 }}>
                  {newRating.toFixed(1)}
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
              <div style={{ fontSize: 12, color: "var(--err)", fontFamily: "var(--mono)", marginTop: 6 }}>
                {submitError}
              </div>
            )}
            <button
              className="btn bp bfull"
              style={{ marginTop: 8, opacity: newRating === 0 || submitting ? 0.6 : 1 }}
              disabled={newRating === 0 || submitting}
              onClick={handleSubmit}
            >
              {submitting ? <Loader size={13} className="spin" /> : <Send size={13} />}
              {submitting ? "Submitting…" : "Submit"}
            </button>
          </div>
        )}

        {!isOwnProfile && alreadyReviewed && (
          <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--bd)", background: "var(--green-bg)", flexShrink: 0 }}>
            <div style={{ fontSize: 12, color: "var(--green-text)", fontFamily: "var(--mono)" }}>
              You've already reviewed this user.
            </div>
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
            const rInitials = `${reviewer.first_name?.charAt(0) || "?"}${reviewer.last_name?.charAt(0) || ""}`.toUpperCase();
            return (
              <div key={r.id || i} className="rev-row">
                <div className="rev-av" style={{ background: reviewer.avatar_color || "#6366f1" }}>
                  {rInitials}
                </div>
                <div style={{ flex: 1 }}>
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
              </div>
            );
          })}
          <div style={{ height: 16 }} />
        </div>
      </div>
    </div>
  );
}
