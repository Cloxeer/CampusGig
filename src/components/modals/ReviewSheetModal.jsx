import { useState } from "react";
import { X, Star, Send } from "lucide-react";
import Stars from "../Stars";

export default function ReviewSheetModal({ onClose, reviews = [], avgRating = 0, reviewCount = 0, isOwnProfile = false }) {
  const [newRating, setNewRating] = useState(0);

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

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet slidein" onClick={(e) => e.stopPropagation()}>
        <div className="handle" />

        <div
          style={{
            padding: "14px 20px 12px",
            borderBottom: "1px solid var(--bd)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-.02em", marginBottom: 3 }}>Reviews</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Stars n={5} size={14} filled={reviewCount > 0} />
              <span style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--mono)" }}>{avgRating.toFixed(1)}</span>
              <span style={{ fontSize: 12, color: "var(--fg3)" }}>{reviewCount} review{reviewCount !== 1 ? "s" : ""}</span>
            </div>
          </div>
          <button className="btn bg-btn bico" onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        {!isOwnProfile && (
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--bd)", background: "var(--bg2)" }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Leave a review</div>
            <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
                  onClick={() => setNewRating(i)}
                >
                  <Star
                    size={22}
                    fill={newRating >= i ? "#fbbf24" : "none"}
                    color={newRating >= i ? "#fbbf24" : "#d4d4d8"}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
            </div>
            <textarea className="ta" style={{ minHeight: 60 }} placeholder="Share your experience…" />
            <button className="btn bp bfull" style={{ marginTop: 8 }}>
              <Send size={13} /> Submit
            </button>
          </div>
        )}

        {reviews.length === 0 && (
          <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--fg4)", fontSize: 13, fontFamily: "var(--mono)" }}>
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
                  <Stars n={r.rating} size={11} filled />
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
  );
}
