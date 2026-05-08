import { Award } from "lucide-react";

/** @param {"self"|"other"} variant */
export default function ProfileRepCard({ repScore, lvl, rank, totalUsers, onRepPath, variant = "self" }) {
  const interactive = variant === "self";
  return (
    <div
      className="rep-card"
      style={{ marginBottom: 16, cursor: interactive && onRepPath ? "pointer" : undefined }}
      onClick={interactive && onRepPath ? () => onRepPath() : undefined}
      role={interactive && onRepPath ? "button" : undefined}
      tabIndex={interactive && onRepPath ? 0 : undefined}
      onKeyDown={
        interactive && onRepPath
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onRepPath();
              }
            }
          : undefined
      }
    >
      <div className="rc-ey">{interactive ? "Rep path · tap to open" : "Rep Score"}</div>
      <div className="rc-row">
        <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
          <span className="rc-score">{repScore}</span>
          <span className="rc-pts">pts</span>
        </div>
        {interactive ? (
          <div style={{ textAlign: "right" }}>
            <div className="rc-badge" style={{ marginBottom: 4, background: lvl.bg, color: lvl.color, borderColor: lvl.border }}>
              <Award size={10} /> {lvl.label}
            </div>
            <div style={{ fontSize: 10, color: "#52525b", fontFamily: "var(--mono)" }}>
              #{rank || "—"} of {totalUsers} student{totalUsers !== 1 ? "s" : ""}
            </div>
          </div>
        ) : (
          <div className="rc-badge" style={{ background: lvl.bg, color: lvl.color, borderColor: lvl.border }}>
            <Award size={10} /> {lvl.label}
          </div>
        )}
      </div>
      <div className="rc-track">
        <div className="rc-fill" style={{ width: `${lvl.pct}%`, background: lvl.color }} />
      </div>
      <div className="rc-labels">
        {["New", "Reliable", "Trusted", "Legend"].map((l) => (
          <span key={l} className="rc-lbl" style={lvl.label === l ? { color: lvl.color, fontWeight: 600 } : undefined}>
            {l}
          </span>
        ))}
      </div>
      {interactive ? (
        <div className="rc-footer">
          {lvl.next ? (
            <>
              +{lvl.toNext} pts to <span style={{ color: lvl.nextColor }}>{lvl.next}</span> · +8 marking done · +10 as taker · +2 per post
            </>
          ) : (
            "Max level reached"
          )}
        </div>
      ) : null}
    </div>
  );
}
