import { useState } from "react";
import { X, Star, Send } from "lucide-react";
import { REVIEWS } from "../../data/mockData";
import Stars from "../Stars";

export default function ReviewSheetModal({ onClose }) {
  const [newRating, setNewRating] = useState(0);

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
              <Stars n={5} size={14} filled />
              <span style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--mono)" }}>4.9</span>
              <span style={{ fontSize: 12, color: "var(--fg3)" }}>28 reviews</span>
            </div>
          </div>
          <button className="btn bg-btn bico" onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        {/* Leave review */}
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

        {/* Reviews list */}
        {REVIEWS.map((r, i) => (
          <div key={i} className="rev-row">
            <div className="rev-av" style={{ background: r.color }}>
              {r.initials}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>{r.name}</span>
                <Stars n={r.rating} size={11} filled />
              </div>
              <div style={{ fontSize: 13, color: "var(--fg2)", lineHeight: 1.5 }}>{r.text}</div>
              <div style={{ fontSize: 11, color: "var(--fg4)", fontFamily: "var(--mono)", marginTop: 3 }}>{r.time}</div>
            </div>
          </div>
        ))}
        <div style={{ height: 16 }} />
      </div>
    </div>
  );
}
